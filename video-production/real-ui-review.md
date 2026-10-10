# KID Social — bản quay giao diện thật

Ngày chuẩn bị: 06/10/2026. Website: https://tuongtacmxh.vercel.app/

## Trạng thái và phạm vi

CHƯA CÓ FOOTAGE THẬT. Tài liệu này là kịch bản và checklist quay, không phải video đã hoàn thành hoặc báo cáo đã kiểm thử website.

Công cụ Browser chưa có trình duyệt kết nối. Chưa xác minh giao diện triển khai, danh mục hiện tại, giá hoặc trạng thái từng dịch vụ. Hai MP4 cũ trong `public/` dùng giao diện dựng lại; không dùng làm bằng chứng giao diện thật và không ghi đè chúng trong bước chuẩn bị này.

Mục tiêu: quay trực tiếp website, mở từng nền tảng, bấm từng dịch vụ và từng server đang hiển thị; giải thích điểm khác nhau, dữ liệu cần nhập, giá và giới hạn. Sau đó hướng dẫn luồng đặt hàng. Không thay đổi hay triển khai website trong công việc làm video này.

## Nguyên tắc hình ảnh và lời đọc

- Mọi màn hình ứng dụng phải là hình quay thật. Giữ nguyên bố cục, tên dịch vụ, logo và nội dung thực tế; chỉ cắt cảnh, phóng vùng đang thao tác, thêm phụ đề và chỉ dấu click.
- Quay cảnh rộng trước mỗi lần phóng vùng để người xem biết vị trí nút. Không ghép trạng thái trước/sau của hai dịch vụ khác nhau thành một thao tác.
- Đọc tên, giá, đơn vị tính, min/max và trạng thái ngay từ màn hình đã quay. Giá/giới hạn trong mã nguồn không thay thế dữ liệu live.
- Đây là review giao diện và cách sử dụng, chưa phải kiểm chứng chất lượng giao hàng. Không nói đã nhận đủ, chạy nhanh, tương tác thật, bảo hành hay an toàn tài khoản nếu chưa có bằng chứng.
- Tên dịch vụ mô tả mục đích được website công bố, không chứng minh hiệu quả. Không đổi tên dịch vụ mua tương tác thành công cụ tăng trưởng tự nhiên để gây hiểu nhầm.
- Chỉ dùng tài khoản và đường dẫn thử nghiệm của chủ web. Không quay mật khẩu, thông báo cá nhân, thông tin khách hàng hoặc giao dịch riêng tư; che dữ liệu riêng tư khi cần, không che bản chất dịch vụ.
- Không tự đăng ký tài khoản, tạo yêu cầu nạp tiền, chuyển tiền, gửi đơn hoặc tiêu hao lượt thử. Cảnh phát sinh giao dịch cần môi trường thử nghiệm được xác nhận không tính phí hoặc sự đồng ý cụ thể trước khi thực hiện.

## Danh sách cảnh từng nền tảng và dịch vụ

Danh sách khởi điểm lấy từ `prisma/seed.ts` và `lib/catalog/threads.ts`: 5 nền tảng, 12 mục dịch vụ, 14 lựa chọn server. Đây không phải danh mục live đã xác nhận. Khi quay phải mở toàn bộ danh sách thực tế; thêm mục mới, ghi nhận mục bị ẩn/bảo trì, không ép website khớp danh sách này.

Với MỖI dòng bên dưới: quay click chọn dịch vụ → trạng thái được chọn → toàn bộ server → lần lượt click từng server khả dụng → thông tin và tổng tiền tương ứng. Giữ đủ lâu để đọc được tên và giá; không chỉ lia qua menu.

| Cảnh | Nền tảng / mục dự kiến | Server trong dữ liệu khởi tạo | Nội dung phải xem riêng |
| --- | --- | --- | --- |
| F01 | Facebook / Lượt thích và cảm xúc bài viết Facebook | SV1, SV2 | Chọn lần lượt lượt thích và cảm xúc; so sánh tên, giá, giới hạn trên màn hình. Xác minh có bộ chọn cảm xúc hay không; không tự thêm vào video. |
| T01 | TikTok / TikTok Likes | SV3 | Đọc mô tả và yêu cầu đường dẫn của mục lượt thích; quay ô số lượng và tổng tiền. |
| T02 | TikTok / TikTok Followers | SV1 | Đọc yêu cầu đường dẫn của mục người theo dõi; chỉ rõ điểm khác với mục lượt thích nếu giao diện có hướng dẫn. |
| T03 | TikTok / TikTok Views | SV1, SV2 | Click cả hai server. So sánh cùng số lượng hợp lệ cho cả hai; nếu không có khoảng chung, giải thích và không so sánh tổng tiền trực tiếp. |
| T04 | TikTok / TikTok Livestream Views | SV1 | Mở riêng mục livestream, đọc điều kiện và loại link nếu có. Không khẳng định số người xem đồng thời hoặc thời lượng nếu web không nêu. |
| T05 | TikTok / TikTok Comments | SV1 | Quay ô nội dung bình luận, nhập các dòng thử nghiệm không gửi; chỉ vào bộ đếm và tổng tiền. Kiểm tra giới hạn thực tế trước khi minh họa. |
| T06 | TikTok / TikTok Shares | SV2 | Mở riêng mục chia sẻ, quay thông tin server và giới hạn; không gộp với Likes hoặc Views. |
| T07 | TikTok / TikTok PK Battle Points | SV1 | Mở riêng mục điểm PK, đọc hướng dẫn thực tế. Nếu thiếu mô tả điều kiện, nói chưa có đủ thông tin; không tự suy đoán cách tính điểm. |
| I01 | Instagram / Người theo dõi Instagram | SV1 | Quay chọn dịch vụ và server; đọc loại link, đơn giá, giới hạn nếu hiển thị. |
| I02 | Instagram / Lượt thích Instagram | SV1 | Click chuyển từ người theo dõi sang lượt thích, quay lại thông tin thay đổi. |
| Y01 | YouTube / YouTube Services | SV1 | Tên khởi tạo còn chung chung. Phải đọc tên và mô tả live trước khi giải thích đây là loại dịch vụ nào. Nếu bảo trì, quay đúng trạng thái đó. |
| H01 | Threads / Tăng follow Threads | SV1 | Đọc hướng dẫn đường dẫn, giá và trạng thái. Xác minh có đang ở chế độ xem trước hay không; không tự kết luận có thể đặt đơn. |

Mỗi lần chuyển nền tảng phải có một cảnh mở menu và click đúng tên. Nếu website có thêm nền tảng/dịch vụ/server, bổ sung cảnh theo cùng mẫu trước khi chốt là đã review đầy đủ.

Mẫu lời đọc mỗi mục, hoàn thiện SAU khi xem footage:

> “Mình chọn [tên nền tảng], rồi mở [tên dịch vụ]. Màn hình đang có [các server nhìn thấy]. Ở [server đang chọn], web hiển thị [giá và đơn vị], giới hạn [min–max]. Phần hướng dẫn yêu cầu [nội dung thật trên web]. Khi nhập [số lượng hợp lệ], tổng tiền hiển thị là [số tiền thực tế].”

Chỉ đọc những trường thật sự xuất hiện. Nếu chỉ xem được biểu mẫu mà chưa gửi đơn, ghi rõ “Minh họa biểu mẫu — chưa gửi đơn”.

## Bản đầy đủ — thời lượng dự kiến 4–5 phút

Các mốc là đề xuất dựng, không phải thời lượng đã quay. Tăng thời gian nếu chữ khó đọc hoặc danh mục live dài hơn.

| Mốc dự kiến | Hình thật cần quay | Lời dẫn / trọng tâm |
| --- | --- | --- |
| 00:00–00:05 | Click mở menu nền tảng ngay trên web | “KID Social có những mục nào? Mình sẽ mở từng dịch vụ và chỉ chỗ kiểm tra thông tin trước khi đặt.” |
| 00:05–00:18 | Toàn cảnh trang tạo đơn, tên miền và tên web | Giải thích trung thực đây là website đặt các dịch vụ tương tác mạng xã hội được liệt kê; video hướng dẫn giao diện, chưa đánh giá kết quả cung cấp dịch vụ. |
| 00:18–00:30 | Mở danh sách nền tảng, di chuyển và chọn mục đầu tiên | Gọi tên các nền tảng thực tế nhìn thấy. Không dùng đoạn logo mở đầu dài. |
| 00:30–00:55 | Cảnh F01 | Facebook: xem cả hai server nếu đang có. |
| 00:55–02:25 | Cảnh T01 đến T07 | TikTok: lần lượt bảy mục dự kiến; Views phải xem cả hai server, Comments phải quay ô nội dung. |
| 02:25–02:50 | Cảnh I01, I02 | Instagram: chọn từng dịch vụ, chỉ phần thay đổi. |
| 02:50–03:05 | Cảnh Y01 | YouTube: chỉ giải thích nội dung đã được xác minh live. |
| 03:05–03:20 | Cảnh H01 | Threads: nêu đúng trạng thái hiện tại. |
| 03:20–04:10 | Luồng biểu mẫu bên dưới | Hướng dẫn dữ liệu đầu vào, lựa chọn dịch vụ/server, số lượng hoặc nội dung, tổng tiền và số dư. |
| 04:10–04:30 | Lịch sử và chi tiết đơn demo có sẵn, nếu được phép xem | Chỉ vị trí xem trạng thái, chi tiết và hỗ trợ. Nếu không có đơn mẫu, quay trạng thái trống và nói rõ; không dựng đơn thành công giả. |

### Luồng đặt hàng cần quay

1. Bắt đầu từ tài khoản demo đã đăng nhập. Có thể quay trang đăng nhập trước đó nhưng cắt toàn bộ lúc nhập thông tin đăng nhập.
2. Mở “Tạo đơn mới”, xác nhận chế độ đặt đơn thường. Giữ bố cục thật: mã nguồn hiện đặt ô link phía trên nền tảng/dịch vụ; đối chiếu lại bản live.
3. Nhập đường dẫn thử nghiệm do chủ web cung cấp, đúng loại dịch vụ và đúng hướng dẫn trên màn hình.
4. Mở bộ chọn nền tảng → click nền tảng → mở bộ chọn dịch vụ → click dịch vụ → click server. Không nhảy cảnh từ danh sách sang trạng thái chọn mà thiếu thao tác.
5. Nhập số lượng trong khoảng hợp lệ. Với mục Comments, quay nội dung thử nghiệm từng dòng và số lượng được tính trên màn hình.
6. Phóng vừa đủ phần giá, tổng tiền và số dư. Nếu thiếu số dư, quay thông báo thực tế. Có thể mở trang nạp tiền để giới thiệu giao diện nhưng không tạo giao dịch hoặc chuyển tiền.
7. Chỉ vào nút “Tạo đơn hàng” và giải thích chức năng. Dừng trước khi bấm nếu chưa được phép gửi đơn. Không ghép cảnh này với một thông báo thành công được tạo giả.
8. Nếu có môi trường test được xác nhận hoặc được phép tạo đơn cụ thể, quay liền mạch thao tác gửi và kết quả thật. Nếu chưa có, ghi phần gửi đơn là CHƯA QUAY, không gọi bản video là hướng dẫn đã thực hiện toàn bộ giao dịch.
9. Mở lịch sử, chi tiết một đơn demo có sẵn nếu có quyền; che dữ liệu riêng tư và đọc đúng trạng thái. Không suy từ trạng thái hệ thống sang việc tương tác thực tế đã được giao thành công.

## Cách dựng dễ theo dõi và giới hạn khi đăng TikTok

TikTok hướng dẫn dùng khung dọc 9:16, hình rõ, chừa chỗ cho giao diện ứng dụng; cấu trúc mở đầu–nội dung–kết và lời đọc/phụ đề giúp truyền tải thông tin. Đây là hướng dẫn sáng tạo quảng cáo, không phải công thức bảo đảm video tự nhiên lên xu hướng. [TikTok Creative Codes](https://ads.tiktok.com/business/en-US/creative-codes)

Áp dụng cho bản này — các mốc thời gian dưới đây là lựa chọn biên tập, không phải quy tắc thuật toán:

- Xuất 1080×1920, 30 fps nếu footage đủ chất lượng. Ưu tiên quay giao diện mobile thật ở khung dọc; nếu quay desktop, giữ cảnh toàn trang rồi phóng vùng đang thao tác, không bóp méo trang cho vừa khung.
- Mở bằng thao tác và câu hỏi cụ thể trong 3–5 giây đầu. Ví dụ: “Hai server trong cùng một dịch vụ khác nhau ở đâu?” Chỉ dùng câu này khi footage thực sự cho thấy và giải thích được khác biệt.
- Bản đầy đủ giữ tất cả dịch vụ. Sau đó mới cắt thành từng clip ngắn, mỗi clip một câu hỏi hoặc một dịch vụ, dự kiến 20–40 giây tùy lượng chữ cần đọc. Không cắt bỏ mục ở bản đầy đủ chỉ để đạt thời lượng ngắn.
- Mỗi cảnh phải có hành động hoặc thông tin mới; cắt đoạn chờ tải và di chuột thừa, giữ vài giây cho người xem đọc giá/giới hạn. Không cắt nhanh đến mức mất chuỗi thao tác.
- Lời đọc tiếng Việt khớp đúng click; phụ đề tối đa hai dòng tại một thời điểm. Chừa phần bên phải và đáy màn hình, kiểm tra bằng bản xem trước TikTok trước khi đăng. Chỉ dấu click không che tên hoặc giá.
- Nhạc nền nhỏ hơn lời nói, có quyền sử dụng thương mại phù hợp; không mặc định nhạc đang thịnh hành là được dùng cho quảng cáo.
- Nếu thử nhiều cách mở đầu, giữ nội dung còn lại tương đương và đánh giá thời gian xem, tỷ lệ xem hết cùng câu hỏi thật của người xem. Không dùng tương tác mua để đánh giá chất lượng video. TikTok cho biết thời gian xem là một tín hiệu trong hệ thống đề xuất; không có ngưỡng công khai bảo đảm lên xu hướng. [Cách TikTok đề xuất nội dung](https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content)

Quan trọng: TikTok không cho phép mua bán dịch vụ tăng tương tác giả; nội dung quảng bá doanh nghiệp cũng phải dùng thiết lập công khai nội dung thương mại. Vì website có các mục mua tương tác, video quảng bá có rủi ro vi phạm từ bản chất dịch vụ, không chỉ từ giao diện hay một từ khóa. Thay chữ, che tên hoặc dựng kiểu review không tự làm nội dung phù hợp quy định. Không hứa tránh ban hoặc lên xu hướng. [Quy định cộng đồng TikTok](https://www.tiktok.com/community-guidelines)

Nếu không phù hợp để đăng TikTok, bản hướng dẫn vẫn có thể được chuẩn bị cho trung tâm trợ giúp của website; chưa tự đăng lên bất kỳ kênh nào. Nội dung TikTok về kiến thức làm nội dung tự nhiên cần đúng bản chất và không biến thành cách che giấu quảng bá dịch vụ bị cấm.

## Checklist trước khi bàn giao video

- [ ] Browser kết nối, truy cập được trang và tài khoản demo.
- [ ] Ghi lại danh mục đang hiện trên web và ngày quay.
- [ ] Quay đủ mọi nền tảng, mọi dịch vụ, mọi server đang khả dụng; ghi nhận cả mục bảo trì.
- [ ] Giá, giới hạn, loại link và các nhận xét đều khớp footage, không lấy giá mẫu trong seed làm giá live.
- [ ] Không dùng lại màn hình vẽ trong các MP4 cũ.
- [ ] Phần gửi đơn có kết quả thật được phép quay, hoặc được đánh dấu rõ là chưa thực hiện.
- [ ] Không lộ thông tin đăng nhập hoặc dữ liệu riêng tư; không phát sinh giao dịch ngoài phạm vi cho phép.
- [ ] Lời đọc/phụ đề khớp thao tác; xem lại ở kích thước điện thoại để kiểm tra độ rõ.
- [ ] Xuất và xem lại MP4; kiểm tra âm thanh, chữ, cảnh mở/đóng menu và toàn bộ chương.
- [ ] Báo đúng những phần đã quay/chưa quay; chỉ bàn giao là video hoàn chỉnh sau khi các cảnh cần thiết thực sự có mặt.
