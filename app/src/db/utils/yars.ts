import { Action, Resource } from '../../utils/enums/application';

import type { Knex } from 'knex';

export function addPolicies(knex: Knex, resources: Array<string>, actions: Array<string>) {
  const items = [];
  for (const resource of resources) {
    for (const action of actions) {
      items.push({
        resource_id: knex('yars.resource').where({ name: resource }).select('resource_id'),
        action_id: knex('yars.action').where({ name: action }).select('action_id')
      });
    }
  }

  return items;
}

export function addRolesForResources(resources: Array<string>) {
  const items: Array<{ name: string; description: string }> = [];

  const addRolesForResource = (resourceName: string) => {
    items.push(
      {
        name: `${resourceName.toUpperCase()}_CREATOR`,
        description: `Can create ${resourceName.toLowerCase()}s`
      },
      {
        name: `${resourceName.toUpperCase()}_VIEWER`,
        description: `Can view ${resourceName.toLowerCase()}s`
      },
      {
        name: `${resourceName.toUpperCase()}_EDITOR`,
        description: `Can edit ${resourceName.toLowerCase()}s`
      }
    );
  };

  for (const resource of resources) {
    addRolesForResource(resource);
  }

  return items;
}

export async function addRolePolicies(knex: Knex, resources: Array<Resource>) {
  const policies = await knex
    .select('p.policy_id', 'r.name as resource_name', 'a.name as action_name')
    .from({ p: 'yars.policy' })
    .innerJoin({ r: 'yars.resource' }, 'p.resource_id', '=', 'r.resource_id')
    .innerJoin({ a: 'yars.action' }, 'p.action_id', '=', 'a.action_id');

  const items: Array<{ role_id: number; policy_id: number }> = [];

  const addRolePolicies = async (resourceName: string) => {
    const creatorId = await knex('yars.role')
      .where({ name: `${resourceName.toUpperCase()}_CREATOR` })
      .select('role_id');
    const viewerId = await knex('yars.role')
      .where({ name: `${resourceName.toUpperCase()}_VIEWER` })
      .select('role_id');
    const editorId = await knex('yars.role')
      .where({ name: `${resourceName.toUpperCase()}_EDITOR` })
      .select('role_id');

    const resourcePolicies = policies.filter((x) => x.resource_name === resourceName);
    items.push(
      {
        role_id: creatorId[0].role_id,
        policy_id: resourcePolicies.find((x) => x.action_name == Action.CREATE).policy_id
      },
      {
        role_id: viewerId[0].role_id,
        policy_id: resourcePolicies.find((x) => x.action_name == Action.READ).policy_id
      },
      {
        role_id: editorId[0].role_id,
        policy_id: resourcePolicies.find((x) => x.action_name == Action.UPDATE).policy_id
      },

      {
        role_id: editorId[0].role_id,
        policy_id: resourcePolicies.find((x) => x.action_name == Action.DELETE).policy_id
      }
    );
  };

  resources.map(async (x) => await addRolePolicies(x));

  return items;
}
