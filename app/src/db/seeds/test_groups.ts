import { Knex } from 'knex';
import { GroupName, Initiative } from '../../utils/enums/application';

export async function seed(knex: Knex): Promise<void> {
  const pcns_id = knex('initiative')
    .where({
      code: Initiative.PCNS
    })
    .select('initiative_id');

  const housing_id = knex('initiative')
    .where({
      code: Initiative.HOUSING
    })
    .select('initiative_id');

  const admin_group_id = await knex('yars.group')
    .where({ initiative_id: housing_id, name: GroupName.ADMIN })
    .select('group_id');

  const developer_group_id = await knex('yars.group')
    .where({ initiative_id: pcns_id, name: GroupName.DEVELOPER })
    .select('group_id');

  const navigator_group_id = await knex('yars.group')
    .where({ initiative_id: housing_id, name: GroupName.NAVIGATOR })
    .select('group_id');

  const supervisor_group_id = await knex('yars.group')
    .where({ initiative_id: housing_id, name: GroupName.SUPERVISOR })
    .select('group_id');

  const identities = [
    { sub: '3dcfc748ac7a45bfa98630e44710653c@idir', group_id: admin_group_id[0].group_id },

    { sub: '8895e3992ee9455b8eef3ab435dd5486@idir', group_id: developer_group_id[0].group_id },
    { sub: '17222a61118846b08bdda2769a585278@idir', group_id: developer_group_id[0].group_id },
    { sub: 'a64c23b15d964d9b979188f356e083ea@idir', group_id: developer_group_id[0].group_id },
    { sub: '333c6b2f38454628b638ca4ac52eab68@idir', group_id: developer_group_id[0].group_id },
    { sub: 'e268cd73d4b544d4bc2c978fb98f342a@idir', group_id: developer_group_id[0].group_id },
    { sub: 'e7d30762682b437cb8d60502c956a516@idir', group_id: developer_group_id[0].group_id },
    { sub: 'ff3ce3f9a6664dfd82a303a189411446@idir', group_id: developer_group_id[0].group_id },
    { sub: '4a07a001034549d79f525715378e617a@idir', group_id: developer_group_id[0].group_id },

    { sub: '067f5f2385cd43fda8c3cb55b04e992e@idir', group_id: navigator_group_id[0].group_id },
    { sub: '8bca8dc363494d8383ca5091e6712fdb@idir', group_id: navigator_group_id[0].group_id },
    { sub: '9ab23d31af1440a0920e69aabba45e22@idir', group_id: navigator_group_id[0].group_id },
    { sub: 'b50e45b3a01e4a7983ca7da70eae74e2@idir', group_id: navigator_group_id[0].group_id },

    { sub: 'f3237101e6034ac1bd247342f6d4eb86@idir', group_id: supervisor_group_id[0].group_id }
  ];

  const exists = await knex('yars.subject_group').whereIn(
    'sub',
    identities.map((x) => x.sub)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = identities.filter((x) => !exists.some((y: any) => y.sub === x.sub));

  // Inserts missing seed entries
  if (filtered.length > 0) {
    await knex('yars.subject_group').insert(filtered);
  }
}
