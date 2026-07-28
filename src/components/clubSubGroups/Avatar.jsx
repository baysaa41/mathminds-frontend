// src/components/clubSubGroups/Avatar.jsx

export const Avatar = ({ user, size = 28 }) => {
  const init = (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase();
  if (user.picture_url) {
    return (
      <img src={user.picture_url} alt="" className="rounded-circle flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover' }} />
    );
  }
  return (
    <div className={`rounded-circle bg-${user._color || 'secondary'} d-flex align-items-center justify-content-center text-white flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {init}
    </div>
  );
};
