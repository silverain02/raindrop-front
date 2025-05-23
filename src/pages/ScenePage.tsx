import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetEncryptedSceneIds } from "@/apis/api/get/useGetEncryptedSceneIds";
import { ButtonLg } from "@/components/scene/ButtonLg";
import { useAuthStore } from "@/store/authStore";
import { SceneLayout } from "@/components/scene/SceneLayout";
import { useWebShare } from "@/hooks/useWebShare";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/common/Modal";
import { useModalStore } from "@/store/modalstore";
import { usePutScenesTheme } from "@/apis/api/put/usePutScenesTheme";
import { EnvironmentPreset } from "@/lib/constants";
import { useSceneStore } from "@/store/sceneStore";
import { SceneMessages } from "@/components/scene/SceneMessages";
import { useDeleteMessage } from "@/apis/api/delete/useDeleteMessage";

export const ScenePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { encryptedSceneId } = useParams<{ encryptedSceneId: string }>();
  const navigate = useNavigate();
  const { isSuccess, data, isError } = useGetEncryptedSceneIds(
    encryptedSceneId as string
  );
  const { user, isAuthenticated } = useAuthStore();
  const shareToLink = useWebShare();
  const [isOwner, setIsOwner] = useState(false);
  const { openModal, closeModal } = useModalStore();
  const { mutate: putTheme } = usePutScenesTheme();
  const { setPreset } = useSceneStore();

  // 메시지 삭제 관련 상태와 훅 추가
  const [selectedMessageToDelete, setSelectedMessageToDelete] = useState<
    number | null
  >(null);
  const { mutate: deleteMessage } = useDeleteMessage(encryptedSceneId ?? "");

  const handleSaveTheme = (preset: EnvironmentPreset) => {
    if (data?.data?.sceneId) {
      putTheme({
        sceneId: data.data.id,
        theme: preset,
      });
    }
  };

  useEffect(() => {
    // 파라미터 처리
    if (searchParams.get("sentBubble") === "true") {
      // 파라미터 제거
      searchParams.delete("sentBubble");
      setSearchParams(searchParams, { replace: true });

      // 비로그인 상태면 첫 번째 모달 띄우기
      if (!isAuthenticated) {
        openModal("shareIntroModal");
      }
    }

    //owner, guest 신분 분기 처리
    if (
      isSuccess &&
      isAuthenticated &&
      data?.data?.ownerSocialId &&
      user?.email === data.data.ownerSocialId
    ) {
      setIsOwner(true);
    }
    // preset
    if (isSuccess) {
      setPreset(data.data.theme);
    }
  }, [isSuccess, data, isAuthenticated, searchParams]);

  // 메시지 길게 누르기 핸들러
  const handleMessageLongPress = (messageId: number) => {
    setSelectedMessageToDelete(messageId);
    openModal("modalMessageDelete");
  };
  // 삭제 확인 핸들러
  const handleDeleteConfirm = () => {
    if (selectedMessageToDelete) {
      deleteMessage(selectedMessageToDelete);
      setSelectedMessageToDelete(null);
      closeModal("modalMessageDelete");
    }
  };

  // 에러 처리
  if (!encryptedSceneId) return null;

  if (isError) {
    navigate("/500");
    return null;
  }

  const handleLeaveMessage = () => {
    navigate(`/message?id=${encryptedSceneId}`);
  };
  const handleOpenThemeModal = () => {
    openModal("themeModal");
  };

  const handleShareIntroConfirm = () => {
    closeModal("shareIntroModal");
    openModal("loginModal");
  };

  return (
    <>
      <SceneLayout
        encryptedSceneId={encryptedSceneId}
        // 2D UI 요소 (PostButton)를 일반 children으로 전달
        children={
          <>
            <div className="pointer-events-auto fixed top-7 right-2 z-50 sm:absolute">
              {/* shareIntroModal */}
              <Modal
                modalKey="shareIntroModal"
                onConfirm={handleShareIntroConfirm}
              />
              <Modal modalKey="loginModal" />

              <Modal
                modalKey="modalMessageDelete"
                onConfirm={handleDeleteConfirm}
              />

              {isOwner && (
                <Button onClick={handleOpenThemeModal} className="shadow-none">
                  <img
                    src="/images/themeButton.png"
                    alt="테마 변경"
                    width={50}
                  />
                </Button>
              )}
              <Modal modalKey="themeModal" onSave={handleSaveTheme} />
            </div>
            <div className="pointer-events-auto fixed bottom-[1%] left-0 w-full flex justify-center sm:absolute">
              <ButtonLg
                isOwner={isOwner}
                onClick={isOwner ? shareToLink : handleLeaveMessage}
              />
            </div>
          </>
        }
        threeChildren={
          <SceneMessages
            encryptedSceneId={encryptedSceneId}
            isOwner={isOwner}
            onLongPress={handleMessageLongPress}
          />
        }
      />
    </>
  );
};
