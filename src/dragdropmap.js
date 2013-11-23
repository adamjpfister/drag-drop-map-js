define(
	[
		'dojo/_base/declare',
		'dojo/Evented',
		'dojo/_base/lang',
		'dojo/_base/array',
		'dojo/on',
		'dojo/dom',
		'dojo/dom-style',
		'dojo/dom-construct',
		'dojo/string',

		'dojox/data/CsvStore', 
		'dojox/encoding/base64',

		'esri/request',
		'esri/urlUtils',
		'esri/graphicsUtils',
		'esri/graphic',
		'esri/SpatialReference',

		'esri/geometry/webMercatorUtils',
		'esri/geometry/Point',
		'esri/geometry/ScreenPoint',

		'esri/layers/GraphicsLayer',
		'esri/layers/FeatureLayer',
		'esri/layers/ArcGISDynamicMapServiceLayer',
		'esri/layers/ArcGISImageServiceLayer',

		'esri/symbols/PictureMarkerSymbol',
		'esri/symbols/SimpleMarkerSymbol',

		'utilities/CsvCommonKeys'
	],
	function(
		declare, Evented, lang, array, on, dom, domStyle, domConstruct, string,
		CsvStore, base64,
		esriRequest, urlUtils, graphicsUtils, Graphic, SpatialReference,
		webMercatorUtils, Point, ScreenPoint,
		GraphicsLayer, FeatureLayer, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer, 
		PictureMarkerSymbol, SimpleMarkerSymbol,
		CsvCommonKeys) {
		
		var dragDropMap = declare('utilities.dragdropmap', [Evented], {
			
			_map: null,

			_csvCommonKeys: null,

			csv: {
				pointSymbol: new SimpleMarkerSymbol().setColor('red').setSize(8),
				returnGraphicsExtent: false
			},

			mapService: {
				promptForVisibleLayers: true,
				opacity: 1
			},

			_wm: new SpatialReference(102100),
			
			_gcs: new SpatialReference(4326),

			constructor: function (options) {
				var me = this;
				if (!options.map) {
					console.log('i need a \'map\' in the config, bro.');
					return;
				}
				me._map = options.map;

				me = lang.mixin(me, options);

				me._csvCommonKeys = new CsvCommonKeys();
				
				me._initMapHandlers();
			},

			_initMapHandlers: function () {
				var me = this,
					mapNode = dom.byId('map');

				on(mapNode, 'dragenter', function(evt) {
					evt.preventDefault();
				});
				on(mapNode, 'dragover', function(evt) {
					evt.preventDefault();
				});
				on(mapNode, 'drop', lang.hitch(me, me._handleDrop));
			},

			_handleDrop: function (evt) {
				evt.preventDefault();

				var me = this,
					dataTransfer = evt.dataTransfer,
					files = dataTransfer.files,
					types = dataTransfer.types;
				
				if (files && files.length === 1) {
					var file = files[0];
					if (file.type.indexOf('image/') !== -1) {
						me._handleImage(file, evt.layerX, evt.layerY);
					} else if (file.name.indexOf('.csv') !== -1) {
						me._handleCsv(file);
					}
				} else if (types) {
					var url;
					array.some(types, function (type) {
						if (type.indexOf('text/uri-list') !== -1) {
							url = dataTransfer.getData('text/uri-list');
							return true;
						} else if (type.indexOf('text/x-moz-url') !== -1) {
							url = dataTransfer.getData('text/plain');
							return true;
						} else if (type.indexOf('text/plain') !== -1) {
							url = dataTransfer.getData('text/plain');
							url = url.replace(/^\s+|\s+$/g, '');
							if (url.indexOf('http') === 0) {
								return true;
							}
						}
						return false;
					});

					if (url) {
						url = url.replace(/^\s+|\s+$/g, '');
						// Check if this URL is a google search result.
						// If so, parse it and extract the actual URL
						// to the search result
						// if (url.indexOf('www.google.com/url') !== -1) {
						// 	var obj = urlUtils.urlToObject(url);
						// 	if (obj && obj.query && obj.query.url) {
						// 		url = obj.query.url;
						// 	}
						// }
						
						if (url.match(/(Map|Feature)Server\/[0-9]+\/query/i)) {
							me._handleServiceQuery(url);
						} else if (url.match(/MapServer\/?/i)) {
							me._handleMapServer(url);
						} else if (url.match(/(Map|Feature)Server\/\d+\/?/i)) {
							me._handleFeatureLayer(url);
						} else if (url.match(/ImageServer\/?/i)) {
							me._handleImageService(url);
						}
					}
				}
			},

			_handleImage: function (file, x, y) {
				var me = this,
					width,
					height,
					img,
					pt,
					symbol,
					graphic,
					reader;

				reader = new FileReader();
				reader.onload = function () {
					img = domConstruct.create('img');
					img.onload = function () {
						width = img.width,
						height = img.height;

						if (me.image && me.image.maxSize) {
							width = (width > me.image.maxSize[0]) ? me.image.maxSize[0] : width;
							height = (height > me.image.maxSize[1]) ? me.image.maxSize[1] : height;
						}

						symbol = new PictureMarkerSymbol(reader.result, width, height);
						pt = me._map.toMap(new ScreenPoint(x, y));
						graphic = new Graphic(pt, symbol);
						
						me.emit('drop-process-complete', { dropType: 'image', graphic: graphic });
					};
					img.src = reader.result;
				};
				reader.readAsDataURL(file);
			},

			_handleMapServer: function (url) {	
				var me = this,
					layer;

				layer = new ArcGISDynamicMapServiceLayer(url);

				if (me.mapService && me.mapService.mapServiceOpacity)
					layer.setOpacity(me.mapService.mapServiceOpacity);

				if (me.mapService && me.mapService.promptForVisibleLayers) {
					var userLayers = prompt('Enter a comma separated list of visible layers to show for this Map Service.\n\nEx: 1,2,4,6\n\nLeave blank to show all');
					if (userLayers && userLayers !== "") {
						var visibleLayers = [];
						for(var i=0; i < userLayers.length; i++) { 
							visibleLayers.push(parseInt(userLayers[i]));
						}
						layer.setVisibleLayers(visibleLayers);
					}
				}
				me.emit('drop-process-complete', { dropType: 'map-service', layer: layer });
			},

			_handleFeatureLayer: function (url) {
				var me = this,
					opacity,
					outFields,
					layer;

				opacity = (me.featureService && me.featureService.featureServiceOpacity) ? me.featureService.featureServiceOpacity : 1;
				outFields = (me.featureService && me.featureService.allOutFields) ? ['*'] : null;
				layer = new FeatureLayer(url, {
					opacity : opacity,
					outFields: outFields,
					mode : FeatureLayer.MODE_ONDEMAND,
					infoTemplate : new InfoTemplate(null, '${*}')
				});
				me.emit('drop-process-complete', { dropType: 'feature-service', layer: layer });
			},

			_handleImageService: function (url) {
				var me = this,
					opacity,
					layer;
				
				opacity = (me.imageService && me.imageService.imageServiceOpacity) ? me.imageService.imageServiceOpacity : 1;
				layer = new ArcGISImageServiceLayer(url, {
					opacity : opacity
				});
				me.emit('drop-process-complete', { dropType: 'image-service', layer: layer });
			},

			_handleServiceQuery: function (url) {
				var me = this;

				esriRequest({
					url: url
				}).then(
					function (response) {
						var returnObj = { dropType: 'agsRestQuery' };
						if (response.features.length == 0)
							returnObj['messages'] = ['no features returned from query', url];

						var graphics = [];
						array.forEach(response.features, function(feature) {
							graphics.push(new Graphic(
								new Point(feature.geometry.x, feature.geometry.y, me._wm),
								new SimpleMarkerSymbol().setColor('red').setSize(8)
							));
						});

						returnObj['graphics'] = graphics;

						if (me.agsRestQuery && me.agsRestQuery.returnGraphicsExtent)
							returnObj['graphicsExtent'] = graphicsUtils.graphicsExtent(graphics);

						me.emit('drop-process-complete', returnObj);
					},
					function (error) {
						me.emit('drop-process-error', 'error querying endpoint.\n' + error.message);
					}
				);
			},

			_handleCsv: function (file) {
				var me = this,
					csvName;

				csvName = file.name.substr(0, file.name.lastIndexOf('.'));
				me._csvPopupTitle = csvName.replace(/_/g,' ');

				if (file.data) {
					var b64 = base64.decode(file.data);
					var decoded = me._bytesToString(b64);
					me._processCsvData(decoded);
				} else {
					var reader = new FileReader();
					reader.onload = function () {
						me._processCsvData(reader.result);
					};
					reader.readAsText(file);
				}
			},

			_processCsvData: function (data) {
				var me = this,
					newlineIndex,
					separator,
					firstLine;

				newlineIndex = data.indexOf('\n');
				firstLine = string.trim(data.substr(0, newlineIndex));
				separator = me._getCsvSeparator(firstLine);

				me._csvStore = new CsvStore({
					data: data,
					separator: separator
				});

				me._csvStore.fetch({
					onComplete: function (items, request) {
						if (items.length === 0) {
							me.emit('drop-process-complete', { dropType: 'csv', graphics: [], messages:['no items returned from csv processing']});
							return;
						}
						me._convertCsvToGraphics(items);
					},
					onError: function (error) {
						me.emit('drop-process-error', error);
					}
				});
			},

			_getCsvSeparator: function (firstLine) {
				var separators = [',', '      ', ';', '|'],
					maxSeparatorLength = 0,
					maxSeparatorValue = '',
					length;

				array.forEach(separators, function (separator) {
					var length = firstLine.split(separator).length;
					if (length > maxSeparatorLength) {
						maxSeparatorLength = length;
						maxSeparatorValue = separator;
					}
				});
				return maxSeparatorValue;
			},

			_convertCsvToGraphics: function (items) {
				var me = this,
					fieldNames,
					latLngFields;

				fieldNames = me._csvStore.getAttributes(items[0]);
				latLngFields = me._getCsvLatLngFields(fieldNames);
				if (!latLngFields) {
					me.emit('drop-process-error', { error: 'unable to get a valid lat/lng field.\nplease make sure your latitude and longitude fields are named appropriately' });
					return;
				}

				var graphics = [],
					atts,
					attributes,
					lonLength,
					latLength,
					latitude,
					longitude,
					geometry,
					symbol;

				array.forEach(items, function (item, index) {
					attributes = {};
					atts = me._csvStore.getAttributes(item);
					
					var value;
					array.forEach(atts, function (att) {
						value = Number(me._csvStore.getValue(item, att));
						if (isNaN(value)) {
							attributes[att] = me._csvStore.getValue(item, att);
						} else {
							attributes[att] = value;
						}
					});

					latitude = Number(attributes[latLngFields[1]]);
					longitude = Number(attributes[latLngFields[0]]);

					if (isNaN(latitude) || isNaN(longitude)) {
						me.emit('drop-process-error', { error: 'error parsing lat/lng field'});
						return;
					}

					lonLength = longitude.toString().split('.')[0].length;
					latLength = latitude.toString().split('.')[0].length;
					if (lonLength > 4 || latLength > 4) {
						geometry = new Point(longitude, latitude, me._wm);
					} else {
						geometry = new Point(longitude, latitude, me._gcs);
					}

					symbol = (me.csv && me.csv.pointSymbol) ? me.csv.pointSymbol : new SimpleMarkerSymbol();

					graphics.push(new Graphic(geometry, symbol, attributes, null));
				});
	
				var returnObj = { dropType: 'csv', graphics: graphics };
				if (me.csv && me.csv.returnGraphicsExtent)
					returnObj['graphicsExtent'] = graphicsUtils.graphicsExtent(graphics);

				me.emit('drop-process-complete', returnObj);
			},

			_getCsvLatLngFields: function (fieldNames) {
				var me = this;

				if (me.csv && me.csv.xyFields) 
					return [me.csv.xyFields[0], me.csv.xyFields[1]];

				return me._csvKeyLookup(fieldNames);
			},

			_csvKeyLookup: function (fieldNames) {
				for (i=0; i < fieldNames.length; i ++) {
					for (var keyField in me._csvCommonKeys.latLngFields) {
						if (keyField === fieldNames[i])
							return me._csvCommonKeys.latLngFields[keyField];
					}
				}
				return null;
			}
		});
		return dragDropMap;
	}
);