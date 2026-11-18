# Solar Cloud 2.9.9 — canh nút Xem thêm và sơ đồ máy tính

Giao diện GitHub Pages dùng chung với web ESP32. Chỉ yêu cầu JSON của **thiết bị được chọn và menu đang mở**, khi tab đang hiển thị. Không cần host PHP, MySQL hoặc Home Assistant. Gói firmware đi kèm chỉ dành cho **ESP32-S3 N16R8**.

Banner chỉ giữ ô chọn **ESP32 đang online** và nút **Kết nối MQTT / Ngắt kết nối** phù hợp trạng thái. Không còn dòng thông tin thiết bị, bộ đếm, ô Device ID thủ công hoặc nút Thêm/Bỏ khỏi danh sách. Nhãn và thông báo trên web dùng tên MQTT.

Dòng điện PV1/PV2, pin, lưới và tải không còn dấu ≈ trong ô tổng quan hoặc chi tiết; vẫn tính từ số liệu như trước. Các tỷ lệ hiệu suất giữ dấu ≈.

Chi tiết biến tần bỏ ba mục **Nghịch lưu**, **Chỉnh lưu**, **Dòng RMS nghịch lưu** trên cả web LAN và GitHub. Các nhiệt độ, điện áp bus và tỷ lệ tải trừ lưới vẫn hiển thị.

Bản2.9.5 giữ đúng vị trí và tỷ lệ sơ đồ1011:615 theo ảnh mẫu trên cả điện thoại và máy tính: bốn ô chữ nhật ở bốn góc, biến tần chèn giữa, đường nối cong có mũi tên. Toàn bộ chữ/hình/đường cùng co theo bề ngang; PV1/PV2 có W và V/A cùng hàng ở mọi chiều rộng. T1/T2/giờ trong ảnh và các cửa sổ chi tiết được giữ. Số liệu lấy từ ESP32, không lấy từ ảnh mẫu.

Bản2.9.6 đặt sơ đồ **bên trái**, bảng điện năng và ước tính chi phí **bên phải** trên máy tính từ901px. Điện thoại/tablet tới900px giữ bố cục2.9.5. Không đổi dữ liệu, nút quản lý bảng giá hoặc công thức tính tiền.

Khi không có công suất hoặc mẫu không còn trực tiếp, dây màu và mũi tên ẩn; chỉ còn nền đường nối tối. Khi có dòng chảy, mũi tên xuất hiện và chuyển động cùng chiều dây. Giữ ngưỡng nghỉ5W, dấu sạc/xả/mua/bán và hỗ trợ giảm chuyển động của hệ điều hành.

Bản2.9.7 bỏ dòng Nguồn cập nhật khỏi trang firmware; kiểm tra/cài online vẫn dùng manifest trong code ESP32. Ô chọn máy online bo tròn, rộng theo tên hiện tại và thu gọn khi thiếu chỗ. Chi tiết pin thêm công suất bên cạnh giới hạn dòng sạc/xả, tính từ điện áp pin hiện tại×giới hạn dòng BMS; ví dụ53,6V×190A=10,18kW. Điện áp thiếu/0 thì công suất—. Không thay số liệu API hoặc cơ chế MQTT.

Bản2.9.8 gom thông tin kỳ EVN, bảng năng lượng, thông báo lưu, nút Lưu ngay/Đồng bộ giờ, lịch sử và footer vào **Xem thêm** mặc định đóng. Bốn số tiền chính/Bảng giá điện luôn hiện. Mở Xem thêm không hỏiJSON đầy đủ; chỉ mở lịch sử hoặc bảng giá mới tải dữ liệu đó. Bấm Thu gọn để ẩn lại.

Sơ đồ máy tính giãn bốn ô xa hình biến tần hơn; điện thoại giữ vị trí như2.9.7. Bỏ hoàn toàn mũi tên, chỉ giữ dây gạch sáng chuyển động đúng chiều khi có công suất. Dây nghỉ hoặc dữ liệu không trực tiếp tối như trước. Cùng giao diện áp dụng trên LAN và GitHub.

Bản2.9.9 đặt Xem thêm ở góc dưới bên phải, thẳng mép Bảng giá điện. Trên máy tính, sơ đồ tự giãn dọc để mép dưới Pin/Tải ngang dòng nút này, hình giữa và dây gắn đúng vị trí. Mở lịch sử không kéo sơ đồ dài theo nội dung. Điện thoại giữ nguyên sơ đồ2.9.8; nút cũng căn phải. Không tạo thêm lưu lượng/API từ việc canh giao diện.

## Cài đặt

1. Nạp firmware đi kèm cho ESP32-S3 N16R8. Mở `http://solar.local` hoặc IP STA của ESP32; khi kết nối AP dùng `http://192.168.4.1`.
2. Vào **Cài Đặt MQTT**, bật MQTT, nhập hostname broker, tài khoản/mật khẩu và topic prefix nhóm. Cổng MQTT TLS mặc định **8883**, chỉnh được 1–65535. Không nhập `mqtts://` hoặc port vào ô hostname.
3. Các ESP32 trong nhóm dùng cùng prefix, ví dụ `luxpower/nhatoi`. Mỗi máy có Device ID theo MAC và client ID riêng, không dùng SN biến tần để gộp thiết bị. Đặt tên máy ở **Cầu Nối TCP → Tên ESP32**.
4. Giữ CA trống để dùng bộ chứng chỉ tin cậy của ESP32, hoặc nhập CA PEM đúng của broker. Thiết bị cần giờ hợp lệ để xác thực TLS. Không có chế độ bỏ kiểm tra chứng chỉ.
5. Sửa `config.js` rồi đưa **index.html và config.js** vào cùng thư mục GitHub Pages. MQTT.js, ảnh biến tần và giao diện đã nhúng trong index.html; không cần tải các file nguồn còn lại hoặc thư viện từ CDN.

```javascript
window.SOLAR_CLOUD_CONFIG = Object.freeze({
  wssUrl: 'wss://TEN-BROKER.emqxsl.com:8084/mqtt',
  topicPrefix: 'luxpower/nhatoi'
});
```

`wssUrl` là URL WebSocket bảo mật trong thông tin kết nối broker. Một số broker dùng cổng8084 và đường dẫn `/mqtt`, số khác dùng443 hoặc đường dẫn riêng. Cổng WSS của trình duyệt khác cổng MQTT TLS8883 của ESP32. Đổi cổng trên ESP32 không tự đổi URL WSS.

File mẫu chứa hostname giữ chỗ `YOUR-EMQX-HOST`; cần thay trước khi kết nối. File config công khai chỉ chứa địa chỉ/topic, **không điền tài khoản hoặc mật khẩu vào mã nguồn**. Nếu thiếu config hoặc cấu hình không hợp lệ, trang báo lỗi và không tự đổi sang broker khác.

## Đăng nhập và chọn thiết bị

Mở Pages, nhập **tài khoản và mật khẩu MQTT**, bấm **Đăng nhập**. Sau khi đăng nhập thành công, thông tin được lưu trong localStorage của trình duyệt này để tự kết nối lần sau. Thông tin đăng nhập và máy ưu tiên tách theo cặp **WSS URL + topic prefix**. **Quên tài khoản** xóa thông tin đã nhớ và ngắt kết nối; **Ngắt kết nối** chỉ dừng phiên hiện tại.

Danh sách tự nhận các máy có bản tin nhận diện hợp lệ và trạng thái online trong nhóm được phép truy cập. Chỉ hiện máy online, theo tên ESP32 kèm ID để phân biệt. Không cần thêm ID bằng tay. Danh sách loại trừ của bản cũ không được dùng nữa, nên máy từng bị ẩn vẫn xuất hiện nếu online.

Khi máy đang xem offline, trang hủy các yêu cầu còn chờ và tự chọn máy online khác nếu có. Nếu không còn máy online, bảng điều khiển được ẩn và trang chờ máy trở lại; không tiếp tục hỏi máy offline. Mất kết nối MQTT sẽ xóa trạng thái online đang giữ, rồi nhận lại danh sách khi kết nối lại. Trạng thái online/offline dựa trên thông báo MQTT/LWT; thời gian phát hiện máy mất mạng phụ thuộc keepalive của broker.

## Lưu lượng theo menu

| Menu | Dữ liệu được yêu cầu |
|---|---|
| Thông Số Biến Tần | PV/lưới/pin/tải, chiều dòng, điện năng và tiền tiết kiệm/phải trả |
| Cài Đặt WiFi | Cấu hình; danh sách mạng chỉ khi bấm tìm mạng tại ESP32 |
| Cầu Nối TCP | Chế độ, SN, tên, trạng thái; IP/MAC và quét LAN theo thao tác |
| Cài đặt Quạt | Cấu hình khi mở, sau đó chỉ trạng thái quạt |
| Cài Đặt MQTT | Cấu hình khi mở, sau đó chỉ trạng thái MQTT |
| Thanh Ghi | Input hoặc Holding đang chọn, bộ chọn API JSON khi cần |
| Cập Nhật Firmware | Trạng thái OTA; tải manifest/bin khi bấm kiểm tra/cập nhật |
| Bảng giá điện / Kỳ điện | Giá và kỳ đã lưu chỉ khi mở phần tương ứng |

Đổi máy/menu, ẩn tab, đóng trang hoặc ngắt MQTT sẽ dừng yêu cầu đọc tự động của phần trước. Chỉ máy đang chọn được hỏi thông số; máy khác chỉ được nhận diện từ bản tin nhỏ. Một yêu cầu đã gửi trước lúc chuyển trang có thể đã được ESP32 xử lý. Chu kỳ làm mới GitHub1–60giây lấy từ cài đặt MQTT của ESP32; nhịp đọc TCP, quạt và ghi sổ điện độc lập.

Không có người xem thì ESP32 không tự phát toàn bộ thông số theo chu kỳ. Vẫn giữ keepalive, bản tin nhận diện khi kết nối/đổi tên và thông báo online/offline. Mỗi tab/người xem tạo yêu cầu riêng. Handshake `hello` chỉ phát sinh trước thao tác khi cần đồng bộ phiên, không có bộ hẹn giờ heartbeat đọc dữ liệu nền.

Yêu cầu cấu hình có Device ID, nonce, thời hạn và chống thực hiện trùng; không nhận lệnh retained. Không xếp lệnh offline để tự chạy khi máy trở lại. Nếu thao tác hết thời gian chờ, đọc lại cài đặt trước khi gửi lại vì ESP32 có thể đã thực hiện.

## Chức năng giữ lại

- Bốn ô PV/lưới/pin/tải, ảnh biến tần có T1/T2 và giờ cập nhật, chiều dòng và năm cửa sổ chi tiết chỉ có thông số tóm tắt. Thanh Ghi vẫn xem raw/quy đổi/API JSON đầy đủ.
- Tiền tiết kiệm/phải trả ngày và kỳ EVN; PV/lưới mua/tải. Bảng giá thêm/xóa tối đa12bậc, VAT cộng sau tổng, ngày chốt1–31. Sổ nằm trong flash ESP32, checkpoint mỗi giờ và giữ24kỳ đã chốt, không có database trên GitHub.
- Tìm Wi-Fi, IP/MAC/SN, quét LAN và chu kỳ đọc; hai chế độ chỉ đọc / đọc và phát SN riêng TCP8000.
- Quạt GPIO40 PWM25kHz, nhiều dải nhiệt độ/công suất theo điều kiện AND, lưu NVS.
- **OTA online** qua manifest cấu hình trên ESP32. **OTA offline/upload.bin chỉ ở web ESP32 trong LAN**, không có trên GitHub và bị API MQTT từ chối.

Khi kiểm tra/cài OTA online, ESP32 tạm đóng MQTT để dành RAM cho HTTPS rồi kết nối lại. Đổi Wi-Fi/broker/prefix hoặc tắt MQTT có thể làm mất kênh hiện tại; dùng web LAN/AP hoặc sửa config.js/tài khoản phù hợp để truy cập lại.

## Topic và quyền MQTT

Với prefix `luxpower/nhatoi`, ID `luxpower_001122334455`:

| Topic | Ý nghĩa |
|---|---|
| `luxpower/nhatoi/luxpower_001122334455/state` | Nhận diện nhỏ chứa tên/chip/phiên bản/nonce, retained; không phải toàn bộ thông số |
| `luxpower/nhatoi/luxpower_001122334455/availability` | Online/offline retained, có LWT |
| `luxpower/nhatoi/luxpower_001122334455/rpc/request` | Handshake/yêu cầu API, QoS1, không retained |
| `luxpower/nhatoi/luxpower_001122334455/rpc/response/<client-id>` | Phản hồi riêng cho trình duyệt, QoS1, không retained |

User ESP32 được publish state/availability/response của chính ID và subscribe request của chính ID. User web được subscribe `+/state`, `+/availability`, `+/rpc/response/+` và publish `+/rpc/request` dưới prefix của mình. Broker phải xác thực và giới hạn ACL đúng nhóm. Device ID/nonce giúp định tuyến, không thay thế ACL.

Phản hồi lớn chia base64 và ghép lại UTF-8; không điền phản hồi của máy trước sang máy đang chọn. Hai API LAN/MQTT dùng chung handler kiểm tra cấu hình và NVS.

## Cập nhật bộ file

Thay `index.html` trên GitHub và giữ `config.js` WSS/topic đang dùng. Firmware2.9.9 dùng cùng bố cục thông số trên web ESP32; nạp OTA application đúng **N16R8** trong gói đầy đủ. Không dùng bootloader/partitions/merged.bin cho OTA. Firmware cũ trước2.8 vẫn phát toàn bộ trạng thái định kỳ, nên cần nâng cấp các máy đó để giảm lưu lượng.

Nguồn phát triển: `cloud.js`, `cloud-shell.html`, `generate.py`, `vendor`, `MQTT_LICENSE.md`. Chạy `python3 SolarCloud/generate.py` sau khi sửa nguồn/giao diện firmware để sinh lại index.html. Trang và firmware đã được kiểm tra bằng mô phỏng/browser trong workspace; gói không tự publish GitHub hoặc truy cập broker/ESP32 thật của bạn.
