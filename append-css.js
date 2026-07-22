const fs = require('fs');
const css = `
/* Admin Tabs Styles */
.badge-admin-header {
  background-color: #003366;
  color: #66B2FF;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 8px;
}

.search-box-large {
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 20px;
  padding: 12px 16px;
  margin-bottom: 20px;
  gap: 12px;
}

.search-box-large svg {
  width: 20px;
  height: 20px;
  stroke: #AAA;
}

.search-box-large input {
  background: transparent;
  border: none;
  color: white;
  font-size: 15px;
  font-family: var(--font-geist);
  width: 100%;
  outline: none;
}

.search-box-large input::placeholder {
  color: #AAA;
}

.dark-list {
  display: flex;
  flex-direction: column;
  background-color: #222;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
}

.dark-list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  color: white;
  text-decoration: none;
}

.dark-list-item:last-child {
  border-bottom: none;
}

.dark-list-item:hover {
  background-color: #2A2A2A;
}

.avatar-initials {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #003366;
  color: #66B2FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  margin-right: 16px;
  flex-shrink: 0;
}

.dark-list-content {
  flex-grow: 1;
}

.dark-list-content strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.dark-list-content p {
  color: #AAA;
  font-size: 13px;
  margin: 0;
}

.dark-list-icon {
  color: #AAA;
  margin-left: 16px;
}

.dark-list-icon svg {
  width: 16px;
  height: 16px;
}

.btn-large-outline {
  width: 100%;
  background-color: #003366;
  color: #66B2FF;
  border: none;
  padding: 16px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-geist);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-large-outline:hover {
  opacity: 0.9;
}

.profile-admin-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
}

.profile-admin-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #003366;
  color: #66B2FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.profile-admin-name {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.profile-admin-role {
  background-color: #333;
  color: #AAA;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Fix dark mode specifically for admin tabs */
.tab-dark {
  background-color: #111;
  color: white;
  padding: 20px;
  border-radius: 24px;
}

.tab-dark .dash-header h1 {
  color: white;
}

.tab-dark .dash-header p {
  color: #AAA;
}

.specialties-grid.dark-grid .specialty-btn {
  background-color: #222;
  color: white;
}

.specialties-grid.dark-grid .specialty-btn:hover {
  background-color: #333;
}
`;
fs.appendFileSync('css/dashboard.css', '\n' + css);
console.log('Appended CSS successfully');
