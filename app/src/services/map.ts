import axios from 'axios';
import config from 'config';
import proj4 from 'proj4';

import type { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * @function openMapsAxios
 * Returns an Axios instance for the CHEFS API
 * @param {AxiosRequestConfig} options Axios request config options
 * @returns {AxiosInstance} An axios instance
 */
function openMapsAxios(options: AxiosRequestConfig = {}): AxiosInstance {
  return axios.create({
    baseURL: config.get('server.openMaps.apiPath'),
    timeout: 10000,
    ...options
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPolygonArray(geoJSON: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polygonArray = geoJSON?.geometry?.coordinates[0]?.map((c: any) => {
    return { lat: c[1], lng: c[0] };
  });
  return polygonArray;
}

const service = {
  /**
   * @function getParcelDataFromPMBC
   * DataBC’s Open Web Services
   * Accessing geographic data via WMS/WFS
   * Services Provided by OCIO - Digital Platforms & Data - Data Systems & Services
   * ref: https://docs.geoserver.org/main/en/user/services/wfs/reference.html#getfeature
   * ref: https://catalogue.data.gov.bc.ca/dataset/parcelmap-bc-parcel-fabric
   * @returns parcel data in JSON
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPIDs: async (geoJSON: any) => {
    const polygon = getPolygonArray(geoJSON);

    // close polygon by re-adding first point to end of array
    // define the source and destination layer types
    // leaflet map layer
    const source = proj4.Proj('EPSG:4326'); // gps format of leaflet map

    // projection (BC Parcel data layer)
    proj4.defs(
      'EPSG:3005',
      // eslint-disable-next-line max-len
      'PROJCS["NAD83 / BC Albers", GEOGCS["NAD83", DATUM["North_American_Datum_1983", SPHEROID["GRS 1980",6378137,298.257222101, AUTHORITY["EPSG","7019"]], TOWGS84[0,0,0,0,0,0,0], AUTHORITY["EPSG","6269"]], PRIMEM["Greenwich",0, AUTHORITY["EPSG","8901"]], UNIT["degree",0.0174532925199433, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4269"]], PROJECTION["Albers_Conic_Equal_Area"], PARAMETER["standard_parallel_1",50], PARAMETER["standard_parallel_2",58.5], PARAMETER["latitude_of_center",45], PARAMETER["longitude_of_center",-126], PARAMETER["false_easting",1000000], PARAMETER["false_northing",0], UNIT["metre",1, AUTHORITY["EPSG","9001"]], AXIS["Easting",EAST], AXIS["Northing",NORTH], AUTHORITY["EPSG","3005"]]'
    );

    const dest = proj4.Proj('EPSG:3005');

    // convert lat/long for WFS query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = polygon.map((point: any) => {
      //@ts-expect-error insufficient type definitions
      return proj4(source, dest, { x: point.lng, y: point.lat });
    });

    // build query string for WFS request
    let query = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.forEach((point: any, index: any, array: any) => {
      query = query.concat(point.x, ' ', point.y);
      if (index < array.length - 1) query = query.concat(', ');
    });

    let params =
      // eslint-disable-next-line max-len
      '/geo/pub/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&outputFormat=json&typeName=WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW&CQL_FILTER=INTERSECTS(SHAPE, POLYGON ((query)))';

    params = params.replace('query', query);

    const response = await openMapsAxios().get(params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parcelData = response.data.features?.map((f: any) => f.properties);

    const PIDs = parcelData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.PID_FORMATTED)
      .filter((pid: string) => pid && pid.trim().length > 0)
      .join(', ');

    return PIDs;
  }
};

export default service;
