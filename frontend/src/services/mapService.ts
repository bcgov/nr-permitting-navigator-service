import { appAxios } from './interceptors';

export default {
  /**
   * @function getPIDs
   * getPIDs - Get the PIDs for a submission
   * @returns {Promise<data | null>} The result of calling the get api
   */
  getPIDs(submissionId: string) {
    return appAxios().get(`map/pids/${submissionId}`);
  }
};
