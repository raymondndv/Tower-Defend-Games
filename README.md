[README.md](https://github.com/user-attachments/files/23711951/README.md)
# Tower Defend – Công khai và hướng dẫn sử dụng

## Chạy nhanh tại máy bạn
- Yêu cầu: có Python hoặc XAMPP (Apache) trên máy.
- Cách 1 (Python):
  - Mở thư mục dự án `c:\xampp\htdocs\tower_defend`.
  - Chạy: `python -m http.server 8000`.
  - Mở: `http://localhost:8000/tower_defense.html`.
- Cách 2 (XAMPP):
  - Đặt thư mục `tower_defend` trong `htdocs`.
  - Start Apache trong XAMPP.
  - Mở: `http://localhost/tower_defend/tower_defense.html`.

## Public để người dùng truy cập
- GitHub Pages (khuyến nghị, miễn phí):
  1. Tạo repo GitHub mới và push toàn bộ mã nguồn.
  2. Vào Settings → Pages → Deploy from branch → chọn branch `main` và `root`.
  3. Sau khi build xong, truy cập: `https://<username>.github.io/<repo>/tower_defense.html`.
  - Lưu ý: nếu muốn URL ngắn gọn, đổi tên `tower_defense.html` → `index.html`.
- Netlify (miễn phí, kéo thả):
  1. Đăng nhập netlify.com → Add new site → Deploy manually.
  2. Kéo thả thư mục dự án lên.
  3. Netlify tạo URL công khai, ví dụ: `https://<tên-site>.netlify.app/` → mở `tower_defense.html`.
- Vercel (miễn phí):
  1. Import repo từ GitHub vào vercel.com.
  2. Chọn framework “Other” (Static Site). Build Output: thư mục gốc.
  3. Mở URL vercel đã cấp → `tower_defense.html`.
- Tạm thời công khai nhanh bằng Ngrok:
  - Chạy server local (Python hoặc Apache), sau đó chạy: `ngrok http 8000` (hoặc `ngrok http 80`).
  - Dùng URL ngrok công khai chia sẻ cho người chơi.

## Mô tả trò chơi chi tiết
- Thể loại: tower defense kết hợp farm để tạo kinh tế.
- Mục tiêu: đặt tháp ngăn quái tới đích, trồng cây để kiếm tiền nâng cấp tháp.
- Độ khó: khởi đầu cao, tăng dần theo map; hỗ trợ đa đường đi (nhiều điểm bắt đầu/kết thúc).

### Chế độ Chiến đấu
- Đặt tháp: chọn tháp từ UI rồi click vị trí hợp lệ trên đường.
- Nâng cấp: click tháp đã đặt để nâng cấp (cần đủ tiền hiển thị trong UI).
- Hủy chọn: chuột phải.
- Điểm bắt đầu/kết thúc: vẽ hang động (start) và lâu đài (end) cho tất cả đường.
- Bảng thống kê: tổng sát thương, thông tin wave, nút điều khiển wave.

### Chế độ Nông trại
- Bố cục: vườn gồm các “Khu” 3×3, canh giữa màn hình; đất có hoạt ảnh.
- Trồng: chọn giống ở thanh dưới, click vào đúng ô đất con trong “Khu”. Cây xuất hiện chính xác vị trí click, có icon và vòng tiến độ.
- Lớn dần: cây có hoạt ảnh tăng trưởng liên tục; vòng tròn xanh lá bao quanh ô thể hiện % tiến độ đến thu hoạch.
- Tưới nước: bình tưới luôn hiển thị tại góc ô; khi tới chu kỳ tưới, bình đổi màu và có giọt nước động để nhắc.
- Thu hoạch: click cây đã trưởng thành để nhận tiền; tiền thu hoạch tăng theo mức chăm nước.

### Cây trồng và thời gian
- Cà rốt: lớn 60 giây; tưới mỗi 5 giây.
- Lúa mì: lớn 90 giây; tưới mỗi 7 giây.
- Bí ngô: lớn 120 giây; tưới mỗi 10 giây.
- Khi quá hạn tưới: nước giảm dần theo thời gian; chỉ chết khi quá hạn > 3 lần chu kỳ tưới và nước cạn (tránh biến mất quá nhanh).

### Điều khiển
- Chuột trái: đặt tháp, trồng cây, tưới nước, thu hoạch.
- Chuột phải: hủy chọn tháp.
- Bàn phím `Tab`: chuyển chế độ Chiến đấu ↔ Nông trại.

### Giao diện & Biểu tượng
- Icon cây giữa ô: 🌱 lúc gieo; 🥕/🌾/🎃 khi đang lớn (theo loại).
- Vòng tiến độ: đường tròn xanh chạy theo % đến thu hoạch.
- Portal: nút “VÀO VƯỜN” chỉ hiển thị khi ở chế độ chiến đấu; ẩn trong vườn. Nút “QUAY LẠI” hiển thị trong vườn.

### Vòng chơi đề xuất
- Bắt đầu: đặt tháp cơ bản ngăn wave đầu.
- Kinh tế: chuyển qua vườn bằng `Tab`, trồng nhanh cây rẻ để tạo dòng tiền.
- Chăm sóc: tưới đúng chu kỳ, để ý cảnh báo; thu hoạch khi chín.
- Mở rộng: quay lại chiến đấu, nâng cấp tháp; lặp lại để vượt map khó.

### Sự cố thường gặp
- 404 trên Vercel: thêm `vercel.json` rewrite `/` → `/tower_defense.html` hoặc đổi tên file thành `index.html`.
- Lỗi đường dẫn: đảm bảo script dùng đường dẫn tương đối `js/...` và đúng chữ hoa/thường.

## Cấu trúc dự án
- `tower_defense.html` – trang chính.
- `js/` – toàn bộ logic game:
  - `game.js` – vòng lặp game, tích hợp chế độ farm.
  - `input.js` – xử lý bàn phím/chuột, chuyển mode, gieo/trồng/tưới/thu hoạch.
  - `map.js` – vẽ map, hang động/lâu đài, đa đường đi.
  - `config.js` – cấu hình tháp/map/kinh tế.
  - `farm.js` – hệ thống nông trại, hoạt ảnh, vòng tiến độ, bình tưới.
  - `farm-ui.js` – UI nông trại, portal chuyển chế độ, hướng dẫn.

## Mẹo triển khai
- Để URL gốc không cần `tower_defense.html`, đổi tên file thành `index.html` trước khi deploy.
- Kiểm tra console browser nếu có lỗi, đảm bảo đường dẫn script trong HTML trỏ đúng tới `js/`.

## Giấy phép
- Mã nguồn dùng cho mục đích học tập/giải trí. Tùy chỉnh tự do theo nhu cầu.
