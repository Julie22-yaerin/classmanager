import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050506",
        }}
      >
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f3cf6b 0%, #c8942f 70%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
