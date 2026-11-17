# Solar Cloud 2.9.3 — GitHub Pages đọc dữ liệu theo menu

Bản này đi cùng firmware **LuxPower Listener 2.9.3**. Trang chỉ yêu cầu JSON của **thiết bị và menu đang mở**. ESP32 không còn phát toàn bộ thông số theo chu kỳ khi không có người xem. Giao diện LAN, quạt, sổ điện EVN và OTA được giữ.

Đưa **hai file `index.html` và `config.js`** lên cùng thư mục GitHub Pages. `index.html` đã nhúng MQTT.js và giao diện dùng chung với ESP32; không cần npm, PHP, MySQL hay CDN. Các file `cloud.js`, `cloud-shell.html`, `generate.py` và thư mục `vendor` là nguồn phát triển, không bắt buộc tải lên Pages.

Bản2.9.0 dùng các ô vuông với icon ngang công suất, SOCpinlớn, dòng pin≈P/V, chi tiếtPV1/PV2/BMS/SmartLoad và Bus/nhiệt độ/hiệu suất. Cập nhật cả ESP32 và index.html để có đủ trường mới. Gói firmware chỉ dành cho ESP32-S3 N16R8. Từ2.9.1: bốn ô vuông ở bốn góc, tên căn giữa và vùng giữa riêng cho hình biến tần lớn; bốn chi tiết chỉ giữ summary, không hỏi thêm Input/Holding. Tỷ lệ tính bằng max(Load−lưới mua,0) chiaPV hoặc pin xả; có thêm tỷ lệ tổng khi hai nguồn cùng cấp. Xem README firmware về công thức và mẫu thiếu.

Từ2.9.2, hình LuxPower dựng theo mẫu đã nhúng trong index.html; không cần tải thêm file ảnh. Asset gốc trong thư mục firmware chỉ phục vụ phát triển.

Từ2.9.3, T1/T2 và giờ cập nhật nằm trong hình biến tần (ảnh thu nhỏ10%); tên thẻ căn dưới icon, mô tả căn dưới công suất. Cả5chi tiết chỉ giữ summary, không tải raw hoặc thông báo chờ thanh ghi. Menu Thanh Ghi giữ đầy đủ chức năng.

## 1. Cài MQTT trên từng ESP32

1. Nạp firmware **2.9.3 cho ESP32-S3 N16R8** từ gói. Mở `http://solar.local` hoặc IP STA ESP32; khi nối AP dùng `http://192.168.4.1`.
2. Vào **Cài Đặt MQTT**, bật MQTT và nhập **hostname EMQX**, tài khoản và mật khẩu.
3. Ô **cổng MQTT** mặc định **8883**, có thể đổi 1–65535 theo cổng MQTT TLS của broker. Kết nối vẫn xác thực CA/hostname khi đổi cổng. Hostname ví dụ `xxxx.emqxsl.com`, không kèm `mqtts://` hoặc `:8883`.
4. Chọn **topic prefix** cho nhóm, ví dụ `luxpower/nhatoi`. Các ESP32 cùng nhóm dùng cùng prefix. Không dùng `+` hoặc `#`, dấu `/` đầu/cuối hay khoảng trắng.
5. Chu kỳ 1–60 giây quyết định nhịp trang yêu cầu số liệu khi đang xem. Mặc định 1 giây; có thể chọn 3–10 giây để giảm lưu lượng. Đây không còn là chu kỳ ESP32 tự phát toàn bộ thông số ra MQTT.
6. Để trống CA PEM nếu broker dùng chứng chỉ thuộc bộ CA tin cậy ESP32. Nếu dùng CA riêng, nhập đúng CA của broker. Không có chế độ bỏ xác thực TLS. ESP32 cần giờ hợp lệ để xác thực chứng chỉ; có thể dùng NTP khi có Internet.
7. Bấm lưu, đợi báo đã kết nối MQTT TLS. Mỗi máy có client ID `solar_<Device ID>` riêng.

Đặt tên máy ở **Cầu Nối TCP → Tên ESP32**, ví dụ “Nhà chính”, “Nhà bố mẹ”. Device ID cố định theo MAC, ví dụ `luxpower_001122334455`; hai ESP32 dùng SN biến tần giống nhau vẫn được phân biệt.

**Cần nâng cấp cả ESP32 và trang GitHub.** Firmware cũ vẫn tự phát trạng thái theo chu kỳ dù mở trang mới, nên lưu lượng chỉ giảm đầy đủ sau khi từng ESP32 được nạp 2.8.0. Gói không tự sửa firmware đang chạy ở máy khác.

## 2. Điền file config.js và đưa lên GitHub Pages

Mở `config.js`, sửa đúng hai giá trị sau rồi lưu:

```javascript
window.SOLAR_CLOUD_CONFIG = Object.freeze({
  wssUrl: 'wss://xxxx.emqxsl.com:8084/mqtt',
  topicPrefix: 'luxpower/nhatoi'
});
```

- `wssUrl`: URL WebSocket bảo mật của EMQX, lấy trong thông tin kết nối broker. EMQX thường dùng cổng 8084 và đường dẫn `/mqtt`; một số triển khai dùng 443 hoặc đường dẫn khác.
- `topicPrefix`: giống prefix đã cài trên các ESP32 của nhóm.

Đây là cấu hình công khai, **không điền tài khoản hoặc mật khẩu vào config.js**. Trình duyệt dùng WSS, không kết nối MQTT TCP trực tiếp tới cổng 8883. Đổi cổng MQTT TLS trên ESP32 không tự đổi cổng WSS; mỗi cổng phải khớp dịch vụ tương ứng trên broker. Chỉ dùng `wss://` với chứng chỉ được trình duyệt tin cậy.

1. Tải **index.html và config.js vào cùng thư mục** repository dùng cho GitHub Pages.
2. Bật Pages cho branch/thư mục đó rồi mở URL HTTPS.
3. Trang hiện broker/topic lấy từ file; chỉ cần nhập **tài khoản và mật khẩu EMQX**, bấm **Đăng nhập**.
4. Chọn máy bằng tên/Device ID trên banner. Các máy trong nhóm xuất hiện từ bản tin nhận diện retained. Ô Device ID, nút **Thêm thiết bị** và **Bỏ khỏi danh sách** cũng nằm trên banner.

File mẫu dùng hostname giữ chỗ `YOUR-EMQX-HOST`, cần thay trước khi đăng nhập. Nếu thiếu file config.js hoặc cấu hình không hợp lệ, trang báo lỗi và không tự nối tới broker khác.

Tài khoản và mật khẩu được lưu trong **localStorage trên trình duyệt này** sau khi đăng nhập thành công. Lần sau mở lại trang sẽ tự đăng nhập và kết nối; không phải nhập lại mật khẩu. Thông tin đã nhớ, máy đã chọn và danh sách thiết bị tách theo cặp **WSS URL + prefix**, nên đổi nhóm/broker không lấy nhầm tài khoản của nhóm cũ. Nút **Quên tài khoản** xóa thông tin đăng nhập đã nhớ cho cấu hình hiện tại và ngắt kết nối. Nút **Ngắt kết nối** chỉ dừng phiên hiện tại, vẫn giữ thông tin để lần sau tự đăng nhập.

Banner chỉ hiện **Kết nối MQTT** khi chưa nối, hoặc **Ngắt kết nối** khi đã mở kết nối; không hiện cả hai cùng lúc. Khi đã nối, khung đăng nhập được thu gọn. Ngắt kết nối để đổi tài khoản hoặc dùng Quên tài khoản.

“Bỏ khỏi danh sách” chỉ ẩn máy trên trình duyệt của bạn, không xóa cấu hình hay tắt ESP32. Thêm lại Device ID để hiện lại. Danh sách trình duyệt không phải database tài khoản; trên trình duyệt khác vẫn có thể tìm lại các thiết bị retained sau khi đăng nhập cùng nhóm.

## 3. Lưu lượng theo menu đang mở

ESP32 giữ kết nối broker để nhận yêu cầu, nhưng **không gửi số liệu biến tần định kỳ** khi không có yêu cầu. Trang chỉ gửi RPC cho máy đang chọn, khi tab Pages đang hiển thị:

| Mục đang mở | Dữ liệu được yêu cầu |
|---|---|
| Thông Số Biến Tần | Thông số tổng quan PV/lưới/pin/tải, chiều dòng và tóm tắt chi phí/sổ điện |
| Cài Đặt WiFi | Cấu hình Wi-Fi; danh sách mạng chỉ khi bấm tìm mạng |
| Cầu Nối TCP | Chế độ, SN, tên và trạng thái liên quan; quét LAN theo thao tác |
| Cài đặt Quạt | Cấu hình và trạng thái quạt; không tải bảng thanh ghi hay thông số tổng quan |
| Cài Đặt MQTT | Cấu hình/trạng thái MQTT; không tải các trang khác |
| Thanh Ghi | Input/Holding và bộ chọn JSON cho trang thanh ghi đang mở |
| Cập Nhật Firmware | Trạng thái OTA; tải manifest khi bấm kiểm tra online |
| Bảng giá điện / Kỳ điện đã lưu | Chỉ tải cấu hình giá và kỳ lưu khi mở bảng giá hoặc mục kỳ đã lưu |

Đổi menu dừng đọc các phần thuộc menu trước. Đổi thiết bị không tiếp tục polling máy cũ. Ẩn tab, đóng trang hoặc ngắt MQTT sẽ dừng các yêu cầu mới; khi quay lại tab, trang đọc tiếp menu đang mở. Một yêu cầu đã gửi trước lúc ẩn/đóng có thể đã được ESP32 xử lý.

Kết nối MQTT vẫn có **keepalive**, bản tin nhận diện nhỏ khi ESP32 kết nối lại/đổi tên, và trạng thái online/offline retained/LWT. Những bản tin này giúp tìm máy và phát hiện mất kết nối; chúng không chứa toàn bộ thông số biến tần định kỳ. Khi chỉ có broker/ESP32 và không mở trang xem, sẽ không có lưu lượng số liệu theo chu kỳ. Nếu mở nhiều tab hoặc nhiều người cùng xem, mỗi trang có các yêu cầu riêng nên lưu lượng tăng theo số người xem và chu kỳ đã chọn.

Trang dùng handshake nhỏ `hello` để xác nhận phiên và uptime trước khi gửi RPC. Handshake chỉ phát sinh khi chuẩn bị đọc/thao tác, không chạy như một bộ hẹn giờ nền. Các yêu cầu cấu hình vẫn có nonce, thời hạn và kiểm tra đúng Device ID. Không có hàng đợi lệnh cấu hình để tự chạy khi thiết bị online trở lại. Nếu thao tác hết thời gian chờ, đọc lại cài đặt trước khi gửi lại vì ESP32 có thể đã thực hiện lệnh.

## 4. Các chức năng giữ lại

- Bốn ô PV/lưới/pin/tải, chiều dòng, cửa sổ chi tiết và tên máy.
- Tiền tiết kiệm/phải trả trong ngày và kỳ EVN, năng lượng PV/lưới mua/tải. Bảng giá điện thêm/xóa tối đa 12 bậc, đơn giá chưa thuế, VAT cộng sau tổng các bậc, ngày chốt 1–31. Sổ lưu trên ESP32 mỗi giờ, giữ 24 kỳ đã chốt; không cần database host. Cấu hình tách riêng theo Device ID.
- Tìm Wi-Fi nhà, chọn SSID và lưu mật khẩu. Danh sách được quét tại ESP32 ở nhà, không phải vị trí điện thoại đang xem Pages.
- IP/MAC/SN thật, quét LAN tại ESP32, chu kỳ đọc biến tần.
- Hai chế độ chỉ đọc / đọc và phát SN riêng TCP8000.
- Quạt GPIO40 PWM25kHz: thêm/xóa dải, điều kiện AND nhiệt độ/công suất, công suất quá max kẹp max, nhiệt độ quá max bỏ dải; lưu trên ESP32.
- Thanh ghi Input/Holding, quy đổi, chọn API JSON, bật/tắt hết, xuất JSON và chẩn đoán.
- Kiểm tra và cài **OTA online** theo manifest trên ESP32. **OTA offline/upload .bin chỉ có tại web ESP32 trong LAN**, không xuất hiện trên GitHub Pages và bị API MQTT từ chối.

Khi kiểm tra/cài OTA online, ESP32 tạm đóng MQTT để nhường RAM cho HTTPS. Trang đợi máy tự kết nối lại; trong lúc đó không gửi thêm lệnh. Cài firmware thành công sẽ reboot. Nếu đổi broker, prefix, cổng hoặc tắt MQTT qua Pages, sau khi lưu có thể mất kênh hiện tại: sửa config.js/tài khoản phù hợp để nối lại. Đổi Wi-Fi cũng có thể làm ESP32 mất Internet; web LAN/AP là cách truy cập lại theo chính sách AP hiện có.

## 5. Topic và quyền EMQX

Với prefix `luxpower/nhatoi`, ID `luxpower_001122334455`:

| Topic | Ý nghĩa |
|---|---|
| `luxpower/nhatoi/luxpower_001122334455/state` | Nhận diện nhỏ: ID/tên/chip/phiên bản/nonce; retained, QoS1; không phải toàn bộ thông số định kỳ |
| `luxpower/nhatoi/luxpower_001122334455/availability` | Online/offline, retained; có LWT |
| `luxpower/nhatoi/luxpower_001122334455/rpc/request` | Handshake/yêu cầu API, QoS1, không retained |
| `luxpower/nhatoi/luxpower_001122334455/rpc/response/<client-id>` | Phản hồi riêng cho phiên trình duyệt, QoS1, không retained |

Broker xác thực và cấp quyền đọc/điều khiển. Với một chủ sở hữu, có thể cấp user quyền trong `luxpower/nhatoi/#` và từ chối nhóm khác. Có thể tách user thiết bị và user web:

- User ESP32: publish `state`, `availability`, `rpc/response/+` của chính ID; subscribe `rpc/request` của chính ID.
- User web quản trị: subscribe `+/state`, `+/availability`, `+/rpc/response/+` dưới prefix của mình; publish `+/rpc/request`.

Device ID/nonce định tuyến và chặn lệnh cũ, không thay cho ACL broker. Cả HTTP LAN và MQTT dùng chung handler API, kiểm tra cấu hình và NVS. Phản hồi lớn được chia base64 để giữ đúng tiếng Việt/UTF-8. Phản hồi máy trước không được điền sang máy đang chọn.

Sổ điện và các kỳ EVN nằm trong flash của từng ESP32; Pages chỉ yêu cầu dữ liệu khi xem, không có database lịch sử trên GitHub hay host. Xem `LuxPowerListener/README_VI.md` trong ZIP về công thức hóa đơn ngày/kỳ, thời điểm reset 00:00 UTC+7 và giới hạn khi mất mẫu. Manifest OTA công khai cần version/binary mới hơn firmware đang chạy để có bản cập nhật; các file trong gói chưa được tự đăng lên GitHub của bạn.
