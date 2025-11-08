'use client';

import { useEffect, useState } from "react";
import snsWebSdk from "@sumsub/websdk";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

const VerificationScreen = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false); // fade-in animation

  useEffect(() => {
    // fade-in al montar
    setTimeout(() => setVisible(true), 50);

    const startVerification = async () => {
      try {
        setLoading(true);

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://83dbcdf74ba7.ngrok-free.app'}/api/verify/start`,
          {
            userId,
            email: "user@example.com",
            phone: "+1234567890",
          }
        );

        const { token } = response.data;
        console.log("✅ Access token received:", token);

        const snsWebSdkInstance = snsWebSdk
          .init(token, () => Promise.resolve(token))
          .withConf({
            lang: "en",
            theme: "dark",
          })
          .withOptions({
            addViewportTag: false,
            adaptIframeHeight: true,
          })
          .on("idCheck.onStepCompleted", (payload) => {
            console.log("✅ Verification step completed:", payload);
          })
          .on("idCheck.onReady", () => {
            // 🔹 Evento que indica que el SDK ya se montó
            console.log("✅ SDK iframe ready");
            setLoading(false);
          })
          .on("idCheck.onFinish", () => {
            console.log("✅ Verification finished");
            setVisible(false);
            setTimeout(() => onClose(), 300); // fade-out antes de cerrar
          })
          .on("idCheck.onError", (error) => {
            console.error("❌ SDK Error:", error);
            alert("Verification failed, please try again.");
          })
          .build();

        snsWebSdkInstance.launch("#sumsub-websdk-container");
        setStarted(true);
      } catch (err) {
        console.error("❌ Error starting verification:", err);
        alert("Failed to start verification");
        onClose();
      }
    };

    if (userId) startVerification();
  }, [userId]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* 🔙 Flecha volver */}
      <button
        className={`absolute top-24 left-6 p-2 rounded-full transition ${
          /* started
            ? "opacity-40 cursor-not-allowed"
            :  */"hover:bg-gray-800 cursor-pointer"
        }`}
        onClick={() => /* !started && */ onClose()}
        /* disabled={started} */
      >
        <ArrowLeft size={24} color="#13E5C0" />
      </button>

      {/* 🧱 Contenedor del SDK */}
      <div
        id="sumsub-websdk-container"
        className={`relative w-full max-w-[480px] h-[600px] rounded-lg overflow-hidden transition-all duration-300 ${
          loading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      ></div>

      {/* ⏳ Loader mientras carga el SDK */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-300 text-sm">Loading verification...</p>
        </div>
      )}
    </div>
  );
};

export default VerificationScreen;
