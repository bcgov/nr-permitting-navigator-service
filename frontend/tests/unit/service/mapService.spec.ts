import mapService from '@/services/mapService';
import { appAxios } from '@/services/interceptors';

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}));

const testSubmissionId = 'submission123';

const getSpy = vi.fn();

vi.mock('@/services/interceptors');
vi.mocked(appAxios).mockReturnValue({
  get: getSpy
} as any);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mapService', () => {
  describe('getPIDs', () => {
    it('calls with given data', () => {
      mapService.getPIDs(testSubmissionId);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`map/pids/${testSubmissionId}`);
    });
  });
});
