import { useQuery } from "@tanstack/react-query";
import { authClient } from "../../client";

/**
 * 암호화된 Scene ID를 사용하여 Scene 정보를 조회하는 훅입니다.
 *
 * @param encryptedSceneIds - 암호화된 Scene ID
 */
export const useGetEncryptedSceneIds = (encryptedSceneIds: string) => {
  return useQuery({
    queryKey: ["sceneIds", encryptedSceneIds],
    queryFn: async () => {
      const { data } = await authClient.get(`/scenes/${encryptedSceneIds}`);
      return data;
    },
    enabled: !!encryptedSceneIds,
  });
};
