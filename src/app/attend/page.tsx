import AttendClient from "./AttendClient";

export const dynamic = "force-dynamic"; // 禁止缓存，确保每次都走最新校验

export default async function AttendPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  return <AttendClient token={resolvedParams.token ?? ""} />;
}
