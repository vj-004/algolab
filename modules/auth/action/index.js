"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { SourceCode } from "eslint";

export const onBoardUser = async () => {
    try{

        const user = await currentUser();
        if(!user){
            return {
                success: false,
                error: "No authenticated user found",
            }
        }
        const {id, firstName, lastName, imageUrl, emailAddresses} = user;
        // console.log('user: ', user);
        const newUser = await db.user.upsert({
            where: {
                clerkId:id
            },
            update:{
                firstName: firstName || null,
                lastName: lastName || null,
                imageUrl: imageUrl || null,
                email: emailAddresses[0]?.emailAddress || "",
            },
            create:{
                clerkId:id,
                firstName: firstName || null,
                lastName: lastName || null,
                imageUrl: imageUrl || null,
                email: emailAddresses[0]?.emailAddress || "",
            }
        });

        return {
            success: true,
            user: newUser,
            message: "User onBoarded Successfully",
        }

    }
    catch(error){
        console.log('Error onboarding user: ', error);
        return {
            success: false,
            error: "Failed to onBoard user"
        };
    }
}


export const currentUserRole = async () => {
    try{

        const user = await currentUser();
        if(!user){
            return {
                success: false,
                error: "No authenticated user found"
            };
        }
        const {id} = user;
        const userRole = await db.user.findUnique({
            where: {
                clerkId: id,
            },
            select:{
                role: true,
            },
        });

        return userRole.role;

    }catch(error){
        console.log('Error in getting the role of the user: ', error);
        return {
            success: false,
            error: "Failed to fetch user role"
        };
    }
}