import { redirect } from "next/navigation";

// /map は将来「知識マップ」用に使う可能性があるため、削除せず残します。
// 今はテーマ一覧の正式URLである /themes へ移動します。
export default function MapRedirectPage() {
  redirect("/themes");
}
