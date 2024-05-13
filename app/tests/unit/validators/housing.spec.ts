import { NUM_RESIDENTIAL_UNITS, YES_NO_UNSURE } from '../../../src/components/constants';
import { housingSchema } from '../../../src/validators/housing';

describe('housingSchema', () => {
  it('should validate the housing schema with valid data', () => {
    const data = {
      financiallySupportedBC: YES_NO_UNSURE.YES,
      financiallySupportedIndigenous: YES_NO_UNSURE.NO,
      financiallySupportedNonProfit: YES_NO_UNSURE.UNSURE,
      financiallySupportedHousingCoop: YES_NO_UNSURE.YES,
      hasRentalUnits: YES_NO_UNSURE.YES,
      housingCoopDescription: 'Housing Coop Description',
      otherSelected: true,
      otherUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      otherUnitsDescription: 'test description',
      projectName: 'Project Name',
      projectDescription: 'Project Description',
      rentalUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE
    };

    const { error } = housingSchema.validate(data);
    expect(error).toBeUndefined();
  });

  it('should not validate the housing schema with invalid data', () => {
    const data = {
      financiallySupportedBC: 'Invalid',
      financiallySupportedIndigenous: YES_NO_UNSURE.YES,
      financiallySupportedNonProfit: YES_NO_UNSURE.NO,
      financiallySupportedHousingCoop: YES_NO_UNSURE.UNSURE,
      hasRentalUnits: YES_NO_UNSURE.YES,
      housingCoopDescription: '',
      indigenousDescription: 'Indigenous Description',
      multiFamilySelected: true,
      multiFamilyUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      nonProfitDescription: '',
      otherSelected: false,
      otherUnits: '',
      otherUnitsDescription: '',
      projectName: 'Project Name',
      projectDescription: 'Project Description',
      rentalUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      singleFamilySelected: false,
      singleFamilyUnits: ''
    };

    const { error } = housingSchema.validate(data);
    expect(error).toBeDefined();
  });

  it('All fields are required', () => {
    const data = {};

    const { error } = housingSchema.validate(data);
    expect(error).toBeDefined();
  });

  it('Fields should not exceed maximum length', () => {
    const data = {
      financiallySupportedBC: YES_NO_UNSURE.YES,
      financiallySupportedIndigenous: YES_NO_UNSURE.NO,
      financiallySupportedNonProfit: YES_NO_UNSURE.UNSURE,
      financiallySupportedHousingCoop: YES_NO_UNSURE.YES,
      hasRentalUnits: YES_NO_UNSURE.YES,
      housingCoopDescription: 'a'.repeat(256),
      otherSelected: true,
      otherUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      otherUnitsDescription: 'a'.repeat(256),
      projectName: 'a'.repeat(256),
      projectDescription: 'a'.repeat(256),
      rentalUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE
    };

    const { error } = housingSchema.validate(data);
    expect(error).toBeDefined();
  });

  it('Only one of singleFamilySelected or otherSelected is allowed', () => {
    const data = {
      financiallySupportedBC: YES_NO_UNSURE.YES,
      financiallySupportedIndigenous: YES_NO_UNSURE.NO,
      financiallySupportedNonProfit: YES_NO_UNSURE.UNSURE,
      financiallySupportedHousingCoop: YES_NO_UNSURE.YES,
      hasRentalUnits: YES_NO_UNSURE.YES,
      housingCoopDescription: 'Housing Coop Description',
      singleFamilySelected: true,
      singleFamilyUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      otherSelected: true,
      otherUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      otherUnitsDescription: 'test description',
      projectName: 'Project Name',
      projectDescription: 'Project Description',
      rentalUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE
    };

    const { error } = housingSchema.validate(data);
    expect(error).toBeDefined();
  });

  it('otherUnitsDescription is allowed only when otherSelected', () => {
    const data = {
      financiallySupportedBC: YES_NO_UNSURE.YES,
      financiallySupportedIndigenous: YES_NO_UNSURE.NO,
      financiallySupportedNonProfit: YES_NO_UNSURE.UNSURE,
      financiallySupportedHousingCoop: YES_NO_UNSURE.YES,
      hasRentalUnits: YES_NO_UNSURE.YES,
      housingCoopDescription: 'Housing Coop Description',
      otherUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE,
      otherUnitsDescription: 'test description',
      projectName: 'Project Name',
      projectDescription: 'Project Description',
      rentalUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE
    };

    const { error } = housingSchema.validate(data);
    expect(error).toBeDefined();
  });

  it('otherUnits should only accept a certain set of values', () => {
    const data = {
      financiallySupportedBC: YES_NO_UNSURE.YES,
      financiallySupportedIndigenous: YES_NO_UNSURE.NO,
      financiallySupportedNonProfit: YES_NO_UNSURE.UNSURE,
      financiallySupportedHousingCoop: YES_NO_UNSURE.YES,
      hasRentalUnits: YES_NO_UNSURE.YES,
      housingCoopDescription: 'Housing Coop Description',
      otherSelected: true,
      otherUnits: 'not-a-valid-value',
      otherUnitsDescription: 'test description',
      projectName: 'Project Name',
      projectDescription: 'Project Description',
      rentalUnits: NUM_RESIDENTIAL_UNITS.ONE_TO_NINE
    };

    const { error } = housingSchema.validate(data);
    expect(error).toBeDefined();
  });
});
