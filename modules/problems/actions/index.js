import { userRoles } from "@/constants";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export const getAllProblems = async () => {

    try {
        const problems = await db.problem.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            data: problems
        };

    } catch (error) {
        console.log('Error fecthing problems: ', error);
        return {
            success: false,
            error: "Failed to fetch problems"
        };
    }
}

export const getProblemById = async (id) => {

    try {
        const problem = await db.problem.findUnique({
            where: {
                id: id,
            },
        });
        return {
            success: true,
            data: problem,
        };
    } catch (error) {
        console.log('Error fecthing problem by id: ', error);
        return {
            success: false,
            error: "Failed to fetch problem by id"
        };
    }

}

export const deleteProblem = async (problemId) => {
    try{
        const user = await currentUser();
        if(!user){
            throw new Error("Unauthorized");
        }
        const dbUser = await db.user.findUnique({
            where: {clerkId: user.id},
            select: {role: true}
        });

        if(dbUser?.role !== userRoles.ADMIN){
            throw new Error("Only admins can delete problems");
        }

        await db.problem.delete({
            where: {id: problemId},
        });

        revalidatePath("/problems");
        return{
            success: true,
            message: "Problem deleted successfully"
        };

    }catch(error){
        console.log('Error deleteting problem by id: ', error);
        return {
            success: false,
            error: error.message || "Failed to delete problem by id"
        };
    }
}