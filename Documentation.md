##Documentation

###Supported Drop Types

- _csv_
	- must have 2 fields that represent X Coordinate and Y Coordinate
	- does not support Address fields (yet)
- _featureService_, _mapService_ & _imageService_
	- ArcGIS Server REST Endpoint URL
- _agsRestQuery_
	- REST Url of an ArcGIS Server Query operation
- _image_ 
	- png, jpg, etc.
	
###Constructor Options
|Name| Type| Drop Config | Default Value | Example | Notes|
|--------|
|pointSymbol| SimpleMarkerSymbol __or__ PictureMarkerSymbol | csv, agsRestQuery | SimpleMarkerSymbol| | Symbol to use for csv locations or REST query results. If omitted, a plain SimpleMarkerSymbol is used.|
|polygonSymbol| SimpleFillSymbol __or__ PictureFillSymbol | agsRestQuery | SimpleFillSymbol| | Symbol to use for REST query results. If omitted, a plain SimpleFillSymbol is used.|
|lineSymbol| SimpleLineSymbol __or__ CartographicLineSymbol | agsRestQuery | SimpleLineSymbol| | Symbol to use for REST query results. If omitted, a plain SimpleLineSymbol is used.|
|xyFields| String[] | csv |  | ['X','Y'] | Fields to use in dropped CSV to map the location. If not specified, a common list of x,y fields will be used in an attempt to match.|
|returnGraphicsExtent| Boolean | csv | false| | Will return extent of all graphics as a convenience to let map zoom to show all csv points.|
|maxSize|Number[]| image|  | [24,24] | Maximum width & height to restrict dropped images.|
|promptForLayerIds| Boolean| mapService| true | | If __false__, the map service will be added and the default visible layers from the map service will be shown. If __true__, a simple prompt will accept a comma separated list of layerIds to use with the map service.|
|opacity| Double | mapService, featureService, imageService | 1 | | Initial opacity or transparency of layer. Values range from 0.0 to 1.0, where 0.0 is 100% transparent and 1.0 has no transparency. Not supported in Internet Explorer.|
|allOutFields|Boolean|featureService| true | | If __false__, no outFields will be specified and only the displayField will be returned.|


###Events
####drop-process-complete
Returns an Object with the following properties

|Name | Type | Notes|
|--------------------|
|dropType |String|Possible values are: "csv" , "image" , "mapService" , "featureService" , "imageService" , "agsRestQuery"|
|messages| String[]| Array of messages providing any supplemental info if available

######for csv:
|Name| Type| Notes|
|--------|
|graphics| Graphic[]| Array of Graphics representing CSV rows|
|graphicsExtent (if __true__ in options)| Extent| Geometry object representing the entire extent of all CSV records|

######for feature, map & image service:
|Name| Type| Notes|
|--------|
|layer| Layer | Layer object of type that was dropped via URL|

######for agsRestQuery:
|Name| Type|Notes|
|----------------|
|graphics| Graphic[] | Array of Graphics representing the query results |
|graphicsExtent (if __true__ in options) | Extent | Geometry object representing the entire extent of the query results|

######for image:
|Name| Type| Notes|
|--------|
|graphic| Graphic| Graphic object with a PictureMarkerSymbol of the image dropped|

####drop-process-error
|Name|Type|Notes|
|----------------|
|error| String| Message describing error|


