import { submissionService } from '@/services';
import { appAxios } from '@/services/interceptors';

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

const PATH = 'submission';
const getSpy = vi.fn();
const deleteSpy = vi.fn();
const patchSpy = vi.fn();
const putSpy = vi.fn();

const testID = 'foobar';
const testObj = {
  field1: 'testField1',
  date1: new Date().toISOString(),
  field2: 'testField2'
};

const testDraft = {
  draftId: 'draft123',
  activityId: 'activity456',
  draftCode: 'code789',
  data: { key: 'value' },
  createdBy: 'testCreatedBy',
  createdAt: new Date().toISOString(),
  updatedBy: 'testUpdatedAt',
  updatedAt: new Date().toISOString()
};

const testEmail = {
  bodyType: 'text/plain',
  body: 'This is a test email body.',
  from: 'sender@example.com',
  subject: 'Test Email Subject',
  to: ['recipient1@example.com', 'recipient2@example.com'],
  cc: ['cc1@example.com'],
  bcc: ['bcc1@example.com'],
  encoding: 'UTF-8',
  priority: 'high',
  tag: 'test'
};

vi.mock('@/services/interceptors');
vi.mocked(appAxios).mockReturnValue({
  delete: deleteSpy,
  get: getSpy,
  patch: patchSpy,
  put: putSpy
} as any);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submissionService', () => {
  describe('getActivityIds', () => {
    it('calls correct endpoint', () => {
      submissionService.getActivityIds();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/activityIds`);
    });
  });

  describe('createSubmission', () => {
    it('calls correct endpoint', () => {
      submissionService.createSubmission();

      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledWith(PATH, undefined);
    });

    it('passes parameters', () => {
      submissionService.createSubmission({ foo: 'bar' });

      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledWith(PATH, { foo: 'bar' });
    });
  });

  describe('deleteSubmission', () => {
    it('calls correct endpoint', () => {
      submissionService.deleteSubmission(testID);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(`${PATH}/${testID}`);
    });
  });

  describe('deleteDraft', () => {
    it('calls correct endpoint', () => {
      submissionService.deleteDraft(testID);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(`${PATH}/draft/${testID}`);
    });
  });

  describe('getDraft', () => {
    it('calls correct endpoint', () => {
      submissionService.getDraft(testID);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/draft/${testID}`);
    });
  });

  describe('getDrafts', () => {
    it('calls correct endpoint', () => {
      submissionService.getDrafts();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/draft`);
    });
  });

  describe('getSubmissions', () => {
    it('calls correct endpoint', () => {
      submissionService.getSubmissions();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(PATH);
    });
  });

  describe('getStatistics', () => {
    it('calls correct endpoint', () => {
      const testFilter = {
        dateFrom: '02/02/2022',
        dateTo: '03/03/2022',
        monthYear: '04/2022',
        userId: 'testUserId'
      };
      submissionService.getStatistics(testFilter);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/statistics`, { params: testFilter });
    });
  });

  describe('getSubmission', () => {
    it('calls correct endpoint', () => {
      const testActivityId = 'testActivityId';
      submissionService.getSubmission(testActivityId);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/${testActivityId}`);
    });
  });

  describe('searchSubmissions', () => {
    it('calls correct endpoint', () => {
      submissionService.searchSubmissions({ activityId: testID });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/search`, { params: { activityId: testID } });
    });

    it('calls endpoint with isDeleted=false if specified', () => {
      submissionService.searchSubmissions({ activityId: testID, isDeleted: false });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/search`, {
        params: {
          activityId: testID,
          isDeleted: false
        }
      });
    });

    it('calls endpoint with isDeleted=true if specified', () => {
      submissionService.searchSubmissions({ isDeleted: true });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(`${PATH}/search`, {
        params: {
          isDeleted: true
        }
      });
    });
  });

  describe('submitDraft', () => {
    it('calls correct endpoint', () => {
      submissionService.submitDraft(testObj);

      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledWith(`${PATH}/draft/submit`, testObj);
    });
  });

  describe('updateDraft', () => {
    it('calls correct endpoint', () => {
      submissionService.updateDraft(testDraft);

      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledWith(`${PATH}/draft`, testDraft);
    });
  });

  describe('updateIsDeletedFlag', () => {
    it('calls correct endpoint', () => {
      submissionService.updateIsDeletedFlag(testID, true);

      expect(patchSpy).toHaveBeenCalledTimes(1);
      expect(patchSpy).toHaveBeenCalledWith(`${PATH}/${testID}/delete`, { isDeleted: true });
    });
  });

  describe('updateSubmission', () => {
    it('calls correct endpoint', () => {
      const testActivityId = 'testActivityId';
      const testObj = {
        field1: 'testField1',
        date1: new Date().toISOString(),
        field2: 'testField2'
      };
      submissionService.updateSubmission(testActivityId, testObj);

      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledWith(`${PATH}/${testActivityId}`, testObj);
    });
  });

  describe('emailConfirmation', () => {
    it('calls correct endpoint', () => {
      submissionService.emailConfirmation(testEmail);

      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledWith(`${PATH}/email`, testEmail);
    });
  });
});
