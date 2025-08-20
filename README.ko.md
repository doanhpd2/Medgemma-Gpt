# DevoChat

*[English](README.md) | Tiếng Việt*

### Nền tảng hội thoại AI tích hợp
DevoChat là ứng dụng web cho phép sử dụng nhiều mô hình AI và máy chủ MCP (Model Context Protocol) trên một giao diện duy nhất. Xem bản demo trực tiếp [tại đây](https://devochat.com).

## Tính năng chính

- **Hệ thống hội thoại tích hợp**
  - Sử dụng schema tích hợp dựa trên MongoDB, cho phép chuyển đổi mô hình AI tự do mà không mất ngữ cảnh trong quá trình hội thoại.
  - Cung cấp lớp client chuẩn hóa dữ liệu theo yêu cầu API của từng nhà cung cấp AI.
  - Quản lý tập trung các loại file media như hình ảnh, PDF, tài liệu...

- **Tính năng hội thoại nâng cao**
  - Cho phép điều chỉnh chi tiết các tham số như nhiệt độ, độ suy luận, độ dài câu trả lời, hệ thống prompt...
  - Hỗ trợ hiển thị Markdown, công thức LaTeX, khối mã nguồn.
  - Hỗ trợ phản hồi dạng streaming, với mô hình không streaming sẽ gửi từng phần để mô phỏng streaming.
  - Hỗ trợ RealTime API cho hội thoại STS (Speech-To-Speech) thời gian thực/độ trễ thấp.

- **Kiến trúc chuyển đổi mô hình**
  - Thêm mô hình AI mới vào hệ thống chỉ với cấu hình JSON, không cần sửa mã nguồn.
  - Với mô hình hybrid, có thể bật/tắt các chức năng đặc biệt như suy luận, tìm kiếm, nghiên cứu sâu...
  - Nếu nhà cung cấp chia chức năng thành nhiều mô hình (VD: Qwen3-235B-A22B-Instruct-2507, Qwen3-235B-A22B-Thinking-2507), có thể kết nối dạng "switch" để hoạt động như một mô hình hybrid duy nhất.

- **MCP client trên nền web**
  - Kết nối trực tiếp mọi loại máy chủ MCP (SSE, local) từ trình duyệt.
  - Sử dụng gói [secure-mcp-proxy](https://github.com/gws8820/secure-mcp-proxy) để truy cập máy chủ MCP local từ web mọi lúc mọi nơi.
  - Hiển thị trực quan quá trình gọi và thực thi công cụ theo thời gian thực.

## Ảnh màn hình

<table>
  <tr>
    <td align="center" width="50%">
      <img src="samples/main.png" alt="Màn hình chính">
      <br>
      <em>Màn hình chính</em>
    </td>
    <td align="center" width="50%">
      <img src="samples/model-select.png" alt="Chọn mô hình">
      <br>
      <em>Chọn mô hình</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="samples/code.png" alt="Khối mã nguồn">
      <br>
      <em>Highlight mã nguồn</em>
    </td>
    <td align="center" width="50%">
      <img src="samples/latex.png" alt="Công thức LaTeX">
      <br>
      <em>Hiển thị công thức</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="samples/image.png" alt="Tải lên hình ảnh">
      <br>
      <em>Tải lên hình ảnh</em>
    </td>
    <td align="center" width="50%">
      <img src="samples/docs.png" alt="Tải lên file">
      <br>
      <em>Tải lên file</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="samples/url.png" alt="Xử lý liên kết URL">
      <br>
      <em>Xử lý URL</em>
    </td>
    <td align="center" width="50%">
      <img src="samples/mcp-select.png" alt="Chọn máy chủ MCP">
      <br>
      <em>Chọn máy chủ MCP</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="samples/mcp-use.png" alt="Sử dụng máy chủ MCP">
      <br>
      <em>Sử dụng máy chủ MCP</em>
    </td>
    <td align="center" width="50%">
      <img src="samples/realtime.png" alt="Hội thoại thời gian thực">
      <br>
      <em>Hội thoại thời gian thực</em>
    </td>
  </tr>
</table>

## Công nghệ sử dụng

![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Textract](https://img.shields.io/badge/Textract-FF6F61?style=for-the-badge)

## Cài đặt & chạy

### Frontend

#### Thiết lập biến môi trường
```
WDS_SOCKET_PORT=0
REACT_APP_FASTAPI_URL=http://localhost:8000
```

#### Cài đặt package & khởi động
```bash
$ cd frontend
$ npm install
$ npm start
```

#### Build & triển khai
```bash
$ cd frontend
$ npm run build
$ npx serve -s build
```

### Backend

#### Tạo môi trường ảo Python
```bash
$ cd backend
$ python -m venv .venv
$ source .venv/bin/activate  # Windows: .venv\Scripts\activate
$ pip install -r requirements.txt
```

#### Thiết lập biến môi trường
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat_db
PRODUCTION_URL=https://your-production-domain.com
DEVELOPMENT_URL=http://localhost:3000
AUTH_KEY=your_auth_secret_key

# Thiết lập API key
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
HUGGINGFACE_API_KEY=...
XAI_API_KEY=...
```

#### Chạy server FastAPI
```bash
$ uvicorn main:app --host=0.0.0.0 --port=8000 --reload
```

## Hướng dẫn sử dụng

### Thiết lập models.json

File `models.json` dùng để định nghĩa các mô hình AI và thuộc tính của chúng trong ứng dụng:

```json
{
    "models": [
      {
        "model_name": "claude-sonnet-4-20250514",
        "model_alias": "Claude 4 Sonnet",
        "description": "Mô hình Claude hiệu năng cao",
        "endpoint": "/claude",
        "in_billing": "3",
        "out_billing": "15",
        "capabilities": {
          "stream": true,
          "image": true,
          "inference": "toggle",
          "search": "toggle",
          "deep_research": false
        },
        "controls": {
          "temperature": "conditional",
          "reason": true,
          "verbosity": true,
          "system_message": true
        },
        "admin": false
      },
      {
        "model_name": "grok-3",
        "model_alias": "Grok 3",
        "description": "Mô hình Grok tiêu chuẩn",
        "endpoint": "/grok",
        "in_billing": "3",
        "out_billing": "15",
        "capabilities": {
          "stream": true,
          "image": false,
          "inference": false,
          "search": false,
          "deep_research": false
        },
        "controls": {
          "temperature": true,
          "reason": false,
          "verbosity": true,
          "system_message": true
        },
        "admin": false
      },
      {
        "model_name": "o3",
        "model_alias": "OpenAI o3",
        "description": "Mô hình GPT suy luận hiệu năng cao",
        "endpoint": "/gpt",
        "in_billing": "2",
        "out_billing": "8",
        "variants": {
          "deep_research": "o3-deep-research"
        },
        "capabilities": {
          "stream": true,
          "image": true,
          "inference": true,
          "search": false,
          "deep_research": "switch"
        },
        "controls": {
          "temperature": false,
          "reason": true,
          "verbosity": true,
          "system_message": true
        },
        "admin": false
      }
      ...
    ]
}
```

### Giải thích tham số

| Tham số | Giải thích |
|---------|------|
| `model_name` | Định danh thực tế của mô hình khi gọi API. |
| `model_alias` | Tên thân thiện hiển thị trên UI. |
| `description` | Mô tả ngắn về mô hình, dùng để tham khảo khi chọn. |
| `endpoint` | Đường dẫn API xử lý yêu cầu mô hình ở backend (VD: `/gpt`, `/claude`, `/gemini`). |
| `in_billing` | Chi phí token đầu vào (prompt), đơn vị USD/triệu token. |
| `out_billing` | Chi phí token đầu ra (response), đơn vị USD/triệu token. |
| `variants` | Định nghĩa mô hình chuyển đổi khi kiểu `"switch"`. |
| `capabilities` | Định nghĩa các chức năng mà mô hình hỗ trợ. |
| `capabilities.stream` | Hỗ trợ phản hồi dạng streaming. |
| `capabilities.image` | Hỗ trợ xử lý hình ảnh. |
| `capabilities.inference` | Hỗ trợ suy luận. Giá trị: `true`, `false`, `"toggle"`, `"switch"` |
| `capabilities.search` | Hỗ trợ tìm kiếm web. Giá trị: `true`, `false`, `"toggle"`, `"switch"` |
| `capabilities.deep_research` | Hỗ trợ nghiên cứu sâu. Giá trị: `true`, `false`, `"toggle"`, `"switch"` |
| `controls` | Định nghĩa các tùy chọn điều khiển người dùng. |
| `controls.temperature` | Có thể điều chỉnh nhiệt độ. Giá trị: `true`, `false`, `"conditional"` |
| `controls.reason` | Có thể điều chỉnh hiệu ứng suy luận. Giá trị: `true`, `false` |
| `controls.verbosity` | Có thể điều chỉnh độ dài câu trả lời. Giá trị: `true`, `false` |
| `controls.system_message` | Có thể thiết lập hệ thống message. Giá trị: `true`, `false` |
| `admin` | Nếu là `true`, chỉ admin mới được chọn/sử dụng mô hình này. |

### Giải thích giá trị

#### true
Chức năng luôn được bật.

#### false  
Chức năng không được hỗ trợ.

#### toggle
Với mô hình hybrid, người dùng có thể bật/tắt chức năng này.

#### switch
Khi người dùng bật chức năng này, sẽ chuyển sang mô hình khác được định nghĩa trong `variants`.

#### conditional  
Chỉ dùng được ở chế độ tiêu chuẩn, không dùng được ở chế độ suy luận.

### Hệ thống chuyển đổi mô hình (Variants)

Định nghĩa các biến thể của mô hình qua đối tượng `variants`.

#### Ví dụ
```json
{
  "model_name": "sonar",
  "variants": {
    "inference": "sonar-reasoning",
    "deep_research": "sonar-deep-research"
  },
  "capabilities": {
    "inference": "switch",
    "deep_research": "switch"
  }
},
{
  "model_name": "sonar-reasoning",
  "variants": {
    "base": "sonar"
  },
  "capabilities": {
    "inference": "switch"
  }
}
```

## Thiết lập máy chủ MCP

DevoChat là MCP client trên nền web.
Định nghĩa các máy chủ bên ngoài trong file `mcp_servers.json`.

### mcp_servers.json

```json
{
  "server-id": {
    "url": "https://example.com/mcp/endpoint",
    "authorization_token": "your_authorization_token", 
    "name": "Tên hiển thị máy chủ",
    "admin": false
  }
}
```

### Máy chủ MCP đề xuất

- **[github](https://github.com/modelcontextprotocol/servers/tree/main/src/github)**
- **[spotify](https://github.com/varunneal/spotify-mcp)** 
- **[arxiv](https://github.com/blazickjp/arxiv-mcp-server)**
- **[perplexity](https://github.com/jsonallen/perplexity-mcp)**
- **[apple-mcp](https://github.com/peakmojo/applescript-mcp)**
- **[desktop-commander](https://github.com/wonderwhy-er/DesktopCommanderMCP)**
- ...

### Kết nối máy chủ MCP local

Để kết nối máy chủ MCP local, sử dụng [secure-mcp-proxy](https://github.com/gws8820/secure-mcp-proxy):

```bash
git clone https://github.com/gws8820/secure-mcp-proxy
cd secure-mcp-proxy
uv run python -m secure_mcp_proxy --named-server-config servers.json --port 3000
```
## Đóng góp

1. Fork repository này
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add amazing feature'`)
4. Push branch lên (`git push origin feature/amazing-feature`)
5. Tạo Pull Request
   
## Giấy phép

Dự án này được phát hành theo [giấy phép MIT](LICENSE)
