# QUY TẮC PHÁT TRIỂN & BẢO TOÀN CÀI ĐẶT (SETTINGS PERSISTENCE RULE)

> [!IMPORTANT]
> **QUY TẮC CỐT LÕI TỪ NGƯỜI DÙNG**:
> "Các thay đổi sau này luôn lưu lại cài đặt, không ghi đè."

## 1. Nguyên Tắc Bảo Toàn Cài Đặt (Non-Destructive Persistence)
1. **Không ghi đè dữ liệu người dùng (`kuromi_bot_settings`)**:
   - Khi cập nhật `app.js` hoặc thêm tính năng mới, luôn dùng cơ chế **Safe Merge**:
     ```javascript
     const updated = { ...DEFAULT_SETTINGS, ...currentStored, ...newSettings };
     ```
   - Không bao giờ gán lại các giá trị mặc định làm mất cài đặt đã lưu (như tên bé, API key Gemini, cấu hình giọng đọc, bật/tắt âm thanh).
2. **Cá nhân hóa cho bé Bảo Hân**:
   - Tên bé mặc định là `Bảo Hân`. Mọi tương tác, chào hỏi, xưng hô Kuromi đều gắn liền với tên bé.
   - Khi ba mẹ đổi tên bé trong giao diện cài đặt, tên mới phải được tự động cập nhật ngay trên toàn bộ giao diện (tiêu đề, thanh trạng thái, tin nhắn, lời bài hát).
3. **Bảo tồn lịch sử trò chuyện (`kuromi_chat_history`)**:
   - Các tin nhắn câu hỏi và tranh ảnh/bài hát bé đã tương tác được tự động lưu lại vào `localStorage`. Khi tải lại trang web hoặc mở lại ứng dụng, lịch sử trò chuyện vẫn hiển thị đầy đủ.
   - Chỉ khi ba mẹ chủ động bấm nút "Xóa Lịch Sử Trò Chuyện" thì mới làm sạch tin nhắn, và việc xóa tin nhắn **tuyệt đối không làm mất các cài đặt cấu hình**.
4. **Tự động lưu trạng thái nút bấm**:
   - Nút bật/tắt Giọng đọc (`ttsEnabled`) và Âm thanh (`sfxEnabled`) tự động lưu ngay khi bấm.
