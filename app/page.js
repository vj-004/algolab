import { Button } from "@/components/ui/button";
import { onBoardUser } from "@/modules/auth/action";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default async function  Home() {

  await onBoardUser();

  return (
    <div className="h-screen justify-center items-center flex flex-col">
      <UserButton/>
    </div>
  );
}
