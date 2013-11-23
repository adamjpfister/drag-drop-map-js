##Sample Usage

```
//create a map
var map = new Map({ ... });

//after map creation
var ddm = new DragDropMap({
	map: map,
	csv: {
		pointSymbol: new SimpleMarkerSymbol().setColor(new Color('red')).setSize(8),
		returnGraphicsExtent: true,
		xyFields: ['EXCEL_POINT_X', 'EXCEL_POINT_Y']
	},
	image: {
		maxImageSize: [32,32]  
	},
	featureService: {
		allOutFields: false
	}
});

//listen for the drop process complete event and then dominate when it's ready
ddm.on('drop-process-complete', 
	function (result) {
		if (result.type === 'csv') {
			array.forEach(result.graphics,
				function(graphic) {
					//add graphic to map .. or not. it's your world.
				}
			);
		} else {
			//either a map, feature or image layer is the result
			map.addLayer(result.layer);
		}	
	}
);
```