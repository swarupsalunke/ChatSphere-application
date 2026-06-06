import axios from "axios";

const API = axios.create({
  baseURL: "https://chatsphere-application-2.onrender.com",
});

export default API;