import { useState } from 'react';
import EditRequestModal from './EditRequestModal';

const useEditRequestModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  const showEditRequestModal = () => {
    setIsVisible(true);
  };

  const hideEditRequestModal = () => {
    setIsVisible(false);
  };

  return {
    EditRequestModal,
    showEditRequestModal,
    hideEditRequestModal,
    isEditRequestModalVisible: isVisible
  };
};

export default useEditRequestModal;
