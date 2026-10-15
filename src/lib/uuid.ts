// Shared by the client (extractRequestId) and the API proxy function, so
// neither pulls the other's dependencies in just for a regex.
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
