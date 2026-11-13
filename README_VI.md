# Solar Cloud 2.6.0 — một file index.html cho GitHub Pages

`index.html` là file hoàn chỉnh, đã nhúng MQTT.js và hai giao diện dùng chung với ESP32. Không cần npm, PHP, MySQL hay file JavaScript/CDN bên ngoài để sử dụng. Các file `cloud.js` và `cloud-shell.html` trong gói chỉ là nguồn để phát triển, không bắt buộc tải lên GitHub Pages.

## 1. Cài MQTT trên từng ESP32

1. Nạp firmware 2.6.0 đúng chip từ gói. Mở `http://solar.local` hoặc IP STA ESP32; khi nối AP dùng `http://192.168.4.1`.
2. Vào **Cài Đặt MQTT**, bật MQTT và nhập **hostname EMQX**, username/password.
3. ESP32 kết nối **MQTT TLS cổng 8883 cố định**, kiểm tra CA và hostname. Hostname ví dụ `xxxx.emqxsl.com`, không kèm `mqtts://` hoặc port.
4. Chọn **prefix** cho nhóm của bạn, ví dụ `luxpower/nhatoi`. Tất cả ESP32 cùng nhóm dùng cùng prefix. Không dùng `+` hoặc `#` trong ô prefix.
5. Mặc định gửi trạng thái mỗi giây; chỉnh 1–60 giây. Nếu nhiều máy hoặc cần giảm lưu lượng EMQX, có thể chọn 3–10 giây. Trang vẫn phản hồi thao tác riêng qua RPC.
6. Để trống CA PEM nếu broker dùng chứng chỉ thuộc bộ CA tin cậy ESP32. Nếu dùng CA riêng, nhập đúng CA của broker. Không có chế độ bỏ xác thực TLS. ESP32 cần Internet/NTP để đồng bộ giờ.
7. Bấm lưu, đợi trạng thái **Đã kết nối EMQX TLS 8883**. Mỗi máy có client ID `solar_<Device ID>` riêng; không dùng client ID trùng nhau.

Đặt tên từng máy ở **Cầu Nối TCP → Tên ESP32**. Ví dụ “Nhà chính”, “Nhà bố mẹ”. Device ID cố định theo MAC, ví dụ `luxpower_001122334455`; không dùng SN biến tần làm ID nên hai ESP32 có SN phát giống nhau vẫn được phân biệt.

## 2. Đưa trang lên GitHub Pages

1. Tải **index.html** vào thư mục gốc repository GitHub dùng cho Pages.
2. Bật GitHub Pages cho branch/thư mục đó; mở URL HTTPS của trang.
3. Nhập **WSS URL** của EMQX. EMQX Cloud thường dùng `wss://xxxx.emqxsl.com:8084/mqtt`. Hãy lấy đúng URL/cổng WSS trong mục thông tin kết nối EMQX của bạn. Một số triển khai dùng 443 hoặc đường dẫn khác.
4. Nhập username/password được cấp quyền và **prefix giống trên ESP32**. Nhấn **Kết nối EMQX**.
5. Các máy trong nhóm tự xuất hiện từ topic trạng thái. Chọn máy bằng tên/Device ID ở đầu trang. Có thể thêm Device ID bằng tay khi chưa có dữ liệu.

Trình duyệt không kết nối MQTT TCP trực tiếp đến cổng 8883; cần WSS. Broker phải bật WSS và dùng chứng chỉ được trình duyệt tin cậy. Không dùng `ws://` trên GitHub Pages HTTPS. Không đưa password vào repository: file này không chứa tài khoản của bạn; password chỉ giữ trong bộ nhớ tab. Username, URL, prefix và danh sách ID được lưu localStorage; đóng/nạp lại trang cần nhập lại password.

Danh sách trên trình duyệt không phải database tài khoản. Khi đổi trình duyệt, các máy có dữ liệu retained sẽ tự được tìm lại sau khi đăng nhập cùng nhóm MQTT. “Bỏ khỏi danh sách” chỉ ẩn trên trình duyệt đó, không xóa hoặc tắt ESP32; thêm lại ID để hiện lại.

## 3. Các thao tác có trên trang GitHub

- Bốn ô PV/lưới/pin/tải, chiều dòng, cửa sổ chi tiết và tên máy.
- Cài Wi-Fi nhà: tìm mạng, chọn SSID, lưu mật khẩu. Danh sách được quét **tại ESP32**, không phải vị trí điện thoại đang xem GitHub.
- Cài IP/MAC/SN thật, quét LAN tại ESP32, chu kỳ đọc.
- Hai chế độ chỉ đọc / đọc và phát SN riêng TCP8000.
- Quạt GPIO40 PWM25kHz: thêm/xóa dải, điều kiện AND, công suất quá max kẹp max, nhiệt độ quá max bỏ dải; lưu tại ESP32.
- Thanh ghi Input/Holding, quy đổi, chọn API JSON, bật/tắt hết, xuất JSON và chẩn đoán.
- Cài MQTT trên ESP32. Nếu đổi broker, prefix hoặc tắt MQTT qua trang từ xa, sau khi lưu có thể mất kênh hiện tại; cập nhật WSS/prefix trên trang để nối lại. Đổi Wi-Fi cũng có thể làm ESP32 mất Internet; web nội bộ/AP vẫn là cách khôi phục theo chính sách AP hiện có.
- Kiểm tra và cài **OTA online** theo manifest trong firmware. **Không có OTA offline/upload .bin trên GitHub**, API upload qua MQTT cũng bị từ chối. OTA offline vẫn dùng được trên web ESP32 trong LAN.

Thiết bị phải online MQTT và có bản tin mới trước khi trang gửi lệnh. Trang không ghi hàng đợi lệnh cấu hình để tự chạy sau khi thiết bị trở lại. Nếu lệnh hết thời gian chờ, đọc lại trạng thái/cài đặt trước khi gửi lại vì lệnh có thể đã được ESP32 xử lý.

## 4. Topic và quyền EMQX

Với prefix `luxpower/nhatoi`, ID `luxpower_001122334455`:

| Topic | Ý nghĩa |
|---|---|
| `luxpower/nhatoi/luxpower_001122334455/state` | Trạng thái mới nhất, retained, QoS1 |
| `luxpower/nhatoi/luxpower_001122334455/availability` | Online/offline, retained; có LWT |
| `luxpower/nhatoi/luxpower_001122334455/rpc/request` | Yêu cầu API, QoS1, không retained |
| `luxpower/nhatoi/luxpower_001122334455/rpc/response/<client-id>` | Phản hồi riêng cho phiên trình duyệt, QoS1, không retained |

Broker là nơi xác thực và cấp quyền điều khiển. Hãy dùng tài khoản riêng và ACL giới hạn namespace của bạn, không mở publish/subscribe cho mọi người. Cách đơn giản cho một chủ sở hữu là cấp user đó quyền trong `luxpower/nhatoi/#`, từ chối nhóm khác. Có thể tách user ESP32 từng máy và user quản trị web:

- User ESP32: publish `state`, `availability`, `rpc/response/+` của chính ID; subscribe `rpc/request` của chính ID.
- User web quản trị: subscribe `+/state`, `+/availability`, `+/rpc/response/+` dưới prefix của mình; publish `+/rpc/request`.

Device ID/nonce giúp định tuyến và chặn lệnh cũ, không thay cho ACL broker. Tài khoản chỉ xem cần bị từ chối quyền publish request. Chỉ dùng username/password của bạn trên trang Pages do bạn kiểm soát.

## 5. Đồng bộ nhiều máy và dữ liệu

Mỗi lệnh chứa Device ID, ID phiên trình duyệt, mã yêu cầu, nonce của kết nối hiện tại và thời hạn ngắn theo uptime ESP32. ESP32 từ chối topic/ID sai, request retained, request hết hạn hoặc nonce cũ. Bộ nhớ ID gần nhất ngăn lặp lại cùng lệnh do QoS1 trong cửa sổ xử lý. Cả HTTP LAN và MQTT gọi chung handler API và cùng kiểm tra cấu hình/NVS.

Chuyển máy tạo bảng điều khiển riêng, phản hồi máy trước không được điền sang máy mới. Phản hồi lớn chia khối base64 để giữ đúng tiếng Việt/UTF-8. Trạng thái retained chỉ dùng tìm máy; trang đợi bản tin sống trước khi cho gửi lệnh. Mất MQTT hoặc thiết bị ngừng phát thì trang báo mất kết nối, không giữ hoạt ảnh live giả.

Chỉ giữ trạng thái cuối trên broker/trình duyệt, không lưu lịch sử sản lượng. EMQX có quota lưu lượng/kết nối theo gói; chu kỳ 1 giây và nhiều máy sẽ tăng lưu lượng.

Đã kiểm thử với broker TLS/WSS trên máy kiểm thử và hai thiết bị mô phỏng, chưa đăng nhập broker EMQX thực của bạn. File đã sẵn để tải lên, chưa được tự đăng lên GitHub của bạn.
