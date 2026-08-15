import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#050506" }}>
        <div
          style={{
            width: 138,
            height: 138,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f3cf6b 0%, #c8942f 70%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 192, height: 192 },
  );
}
