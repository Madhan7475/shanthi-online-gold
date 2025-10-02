import axiosInstance from '../utils/axiosInstance';

export const phonePeService = {
  // Create PhonePe order to get payment link and merchantTransactionId
  initiateCheckout: async (orderData) => {
    try {
      const response = await axiosInstance.post('/phonepe/initiate-checkout', orderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create PhonePe order');
    }
  },

  // Verify PhonePe payment status
  checkPaymentStatus: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/phonepe/order-status/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify PhonePe payment');
    }
  }
};