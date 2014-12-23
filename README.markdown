## Fulcrum AGS Import

Import an ArcGIS Server service layer into Fulcrum, creating both the form and associated records.

### Installation

    npm install -g fulcrum-ags-import

### Usage

    fulcrum-ags-import <map_service_layer_url> [options]

A simple example that imports all features:

    fulcrum-ags-import http://gis-web.co.union.nc.us/arcgis/rest/services/PWGIS_Web/Operational_Layers/MapServer/5

You can skip importing some fields:

    fulcrum-ags-import http://gis-web.co.union.nc.us/arcgis/rest/services/PWGIS_Web/Operational_Layers/MapServer/5 --skip-fields=Northing,Easting

Add a where clause to filter your features. Any SQL supported by ArcGIS Server should work here:

    fulcrum-ags-import http://gis-web.co.union.nc.us/arcgis/rest/services/PWGIS_Web/Operational_Layers/MapServer/5 --where='manhole_depth<6'
