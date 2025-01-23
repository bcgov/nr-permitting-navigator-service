import { geocoderAxios, orgBookAxios } from './interceptors';
import { ADDRESS_CODER_QUERY_PARAMS, ORG_BOOK_QUERY_PARAMS } from '@/utils/constants/housing';

import type { AxiosResponse } from 'axios';

export default {
  /**
   * @function searchOrgBook
   * Calls OrgBook API to search for company names
   * @param {string} nameSearch SearchUsersOptions object containing the data to filter against
   * @returns {Promise<AxiosResponse>} An axios response or empty array
   */
  searchOrgBook(nameSearch: string): Promise<AxiosResponse> {
    return orgBookAxios().get('/search/autocomplete', { params: { q: nameSearch, ...ORG_BOOK_QUERY_PARAMS } });
  },

  searchAddressCoder(addressSearch: string): Promise<AxiosResponse> {
    return geocoderAxios().get('/addresses.json', {
      params: {
        addressString: addressSearch,
        ...ADDRESS_CODER_QUERY_PARAMS
      }
    });
  },

  async getNearestOccupant(longitude: string, lattitude: string) {
    return geocoderAxios().get('/occupants/nearest.json', {
      params: {
        point: `${longitude},${lattitude}`
      }
    });
  }
};
