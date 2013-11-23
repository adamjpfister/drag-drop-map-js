define(['dojo/_base/declare'],
	function (declare) {
		var csvConfig = declare('utilities.CsvCommonKeys', null, {
			latLngFields : {
				'X': ['X', 'Y'],
				'Y': ['X', 'Y'],
				'LAT' : ['LON','LAT'],
				'LON' : ['LON','LAT'],
				'LAT' : ['LONG', 'LAT'],
				'LONG' : ['LONG','LAT'],
				'LATITUDE' : ['LONGITUDE', 'LATITUDE'],
				'LONGITUDE' : ['LONGITUDE', 'LATITUDE'],
				'EXCEL_POINT_X' : ['EXCEL_POINT_X', 'EXCEL_POINT_Y'],
				'EXCEL_POINT_Y' : ['EXCEL_POINT_X', 'EXCEL_POINT_Y'],

				'x': ['x', 'y'],
				'y': ['x', 'y'],
				'lat' : ['lon','lat'],
				'lon' : ['lon', 'lat'],
				'lat' : ['long', 'lat'],
				'long' : ['long', 'lat'],
				'latitude' : ['longitude', 'latitude'],
				'longitude' : ['longitude', 'latitude'],
				'excel_point_x' : ['excel_point_x', 'excel_point_y'],
				'excel_point_y' : ['excel_point_x', 'excel_point_y'],

				'Lat' : ['Lon','Lat'],
				'Lon' : ['Lon','Lat'],
				'Lat' : [ 'Long', 'Lat'],
				'Long' : [ 'Long', 'Lat'],
				'Latitude' : [ 'Longitude','Latitude'],
				'Longitude' : [ 'Longitude','Latitude'],
				'Excel_Point_X' : ['Excel_Point_X', 'Excel_Point_Y'],
				'Excel_Point_Y' : ['Excel_Point_X', 'Excel_Point_Y']
			},
			
			validPairsList: 'X,Y\nx,y\nLAT,LON\nLat,Lon\nlat,lon\nLAT,LONG\nLat,Long\nlat,long\nLATITUDE,LONGITUDE\nLatitude,Longitude\nlatitude,longitude\nEXCEL_POINT_X,EXCEL_POINT_Y\nExcel_Point_X,Excel_Point_Y\nexcel_point_x,excel_point_y'
		});	
		return csvConfig;
	}
);