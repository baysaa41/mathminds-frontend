// src/components/clubSubGroups/displayName.js

export const displayName = (u) =>
  u.last_name ? `${u.last_name} ${u.first_name}`.trim() : u.first_name || u.username;
