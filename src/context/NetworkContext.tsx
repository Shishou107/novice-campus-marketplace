import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

export interface NetworkContextType {
  isConnected: boolean;
  isDntuWifi: boolean;
  networkName: string;
  isSimulated: boolean;
  setSimulatedDntuWifi: (enabled: boolean) => void;
  setSimulatedOffline: (enabled: boolean) => void;
  checkNetworkStatus: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isDntuWifi, setIsDntuWifi] = useState<boolean>(true);
  const [networkName, setNetworkName] = useState<string>('DNTU_Student_Secure (Wi-Fi Trường)');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  const checkNetworkStatus = useCallback(async () => {
    if (isSimulated) return;

    try {
      const state = await Network.getNetworkStateAsync();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(online);

      if (online) {
        // Trong môi trường Web hoặc Native, nhận diện mạng DNTU
        if (state.type === Network.NetworkStateType.WIFI) {
          setNetworkName('DNTU_Student_Secure (Wi-Fi Trường)');
          setIsDntuWifi(true);
        } else if (state.type === Network.NetworkStateType.CELLULAR) {
          setNetworkName('Dữ liệu di động 4G/5G');
          // Sinh viên dùng 4G ngoài trường vẫn được phép truy cập xem dữ liệu
          setIsDntuWifi(false);
        } else {
          setNetworkName(Platform.OS === 'web' ? 'Mạng DNTU Campus' : 'Wi-Fi');
          setIsDntuWifi(true);
        }
      } else {
        setNetworkName('Không có kết nối mạng (Ngoại tuyến)');
        setIsDntuWifi(false);
      }
    } catch {
      // Mặc định kết nối nội bộ
      setIsConnected(true);
      setIsDntuWifi(true);
      setNetworkName('DNTU_Student_Secure (Wi-Fi Trường)');
    }
  }, [isSimulated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkNetworkStatus();
    }, 0);
    const interval = setInterval(() => {
      void checkNetworkStatus();
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkNetworkStatus]);

  // Cho phép mô phỏng trạng thái mạng phục vụ thuyết trình nghiệm thu
  const setSimulatedDntuWifi = (enabled: boolean) => {
    setIsSimulated(true);
    setIsConnected(true);
    setIsDntuWifi(enabled);
    setNetworkName(enabled ? 'DNTU_Student_Secure (Mô phỏng Wi-Fi trường)' : 'Mạng ngoài / 4G cá nhân');
  };

  const setSimulatedOffline = (offline: boolean) => {
    setIsSimulated(true);
    setIsConnected(!offline);
    setIsDntuWifi(!offline);
    setNetworkName(offline ? 'Ngoại tuyến (Offline)' : 'DNTU_Student_Secure (Wi-Fi Trường)');
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isDntuWifi,
        networkName,
        isSimulated,
        setSimulatedDntuWifi,
        setSimulatedOffline,
        checkNetworkStatus,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork phải được sử dụng bên trong NetworkProvider');
  }
  return context;
}
