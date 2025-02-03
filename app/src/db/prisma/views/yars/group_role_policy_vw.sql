SELECT
  row_number() OVER () AS row_number,
  "group".group_id,
  initiative.code AS initiative_code,
  "group".name AS group_name,
  role.name AS role_name,
  policy.policy_id,
  resource.name AS resource_name,
  ACTION.name AS action_name,
  attribute.name AS attribute_name
FROM
  (
    (
      (
        (
          (
            (
              (
                (
                  (
                    yars."group"
                    JOIN initiative ON (
                      ("group".initiative_id = initiative.initiative_id)
                    )
                  )
                  JOIN yars.group_role ON ((group_role.group_id = "group".group_id))
                )
                JOIN yars.role ON ((role.role_id = group_role.role_id))
              )
              JOIN yars.role_policy ON ((role_policy.role_id = role.role_id))
            )
            JOIN yars.policy ON ((policy.policy_id = role_policy.policy_id))
          )
          JOIN yars.resource ON ((resource.resource_id = policy.resource_id))
        )
        JOIN yars.action ON ((ACTION.action_id = policy.action_id))
      )
      LEFT JOIN yars.policy_attribute ON ((policy_attribute.policy_id = policy.policy_id))
    )
    LEFT JOIN yars.attribute ON (
      (
        attribute.attribute_id = policy_attribute.attribute_id
      )
    )
  );