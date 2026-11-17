// Sửa hai giá trị này, rồi tải config.js và index.html lên cùng thư mục GitHub Pages.
// File này công khai: không ghi tài khoản hoặc mật khẩu vào đây.
window.SOLAR_CLOUD_CONFIG = Object.freeze({
  wssUrl: 'wss://YOUR-EMQX-HOST:8084/mqtt',
  topicPrefix: 'luxpower'
});
