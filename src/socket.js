import { io } from "socket.io-client";


// должен совпадать с портом сервера
export const socket = io(
  import.meta.env.VITE_REACT_API_URL || "http://localhost:5000",
  {
    extraHeaders: {
      "ngrok-skip-browser-warning": "69420",
    },
  },
);
