import api from './api';

export const rentedRoomService = {
  getAll: async () => {
    const response = await api.get('/rented-rooms/');
    return response.data;
  },

  getByRoom: async (roomId) => {
    const response = await api.get(`/rented-rooms/room/${roomId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/rented-rooms/${id}`);
    return response.data;
  },

  // create: async (rentedRoomData) => {
  //   const response = await api.post('/rented-rooms/', rentedRoomData);
  //   return response.data;
  // },

  create: async (rentedRoomData) => {
    try {
      const response = await api.post('/rented-rooms/', rentedRoomData);
      return response.data;
    } catch (error) {
      // Axios trả lỗi HTTP ở đây
      if (error.response) {
        // error.response.data chứa chi tiết lỗi từ FastAPI
        console.log(error.response.data);

        // Ví dụ hiển thị alert hoặc return lỗi
        alert(error.response.data.detail?.[0]?.msg || "so nguoi thue qua lon");
        // Này tớ muốn giữ lại form khi mình bấm OK ở alert. (không biết còn cách khác ko)
        const response = await api.post('/rented-rooms/', rentedRoomData);
        return response.data;
      } else {
        console.error(error);
        alert("Uuuuuuuuuuuuuuuu");
        return null;
      }
    }
  },

  update: async (id, rentedRoomData) => {
    const response = await api.put(`/rented-rooms/${id}`, rentedRoomData);
    return response.data;
  },

  terminate: async (id) => {
    const response = await api.post(`/rented-rooms/${id}/terminate`);
    return response.data;
  }
};
