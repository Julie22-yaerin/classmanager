import { ImageResponse } from "next/og";

export const alt = "Lyceum — one chat that learns your classes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #050506 0%, #1c1c1e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f3cf6b 0%, #c8942f 70%)",
            display: "flex",
            marginBottom: 40,
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 700, color: "#fafafa", letterSpacing: -1 }}>Lyceum</div>
        <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 16 }}>One chat that learns your classes</div>
      </div>
    ),
    { ...size },
  );
}
