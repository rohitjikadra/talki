/**
 * Resolve first/last name from API body.
 * Required API tags: first_name, last_name
 * fullName is ALWAYS built as "first_name last_name" — request fullName is ignored.
 */
const resolveNameFields = (body = {}) => {
  const firstName = String(body.first_name ?? body.firstName ?? "").trim();
  const lastName = String(body.last_name ?? body.lastName ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    firstName,
    lastName,
    fullName,
  };
};

/** Both first_name and last_name must be non-empty */
const hasRequiredNames = (body = {}) => {
  const { firstName, lastName } = resolveNameFields(body);
  return Boolean(firstName && lastName);
};

module.exports = {
  resolveNameFields,
  hasRequiredNames,
};
