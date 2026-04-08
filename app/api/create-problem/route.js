import { userRoles } from "@/constants";
import { currentUserRole, getCurrentUser } from "@/modules/auth/action";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request){
    try {

        const userRole = await currentUserRole();
        const user = await getCurrentUser();

        if(userRole !== userRoles.ADMIN){
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }    

        const body = await request.json();

        const {
            title,
            description,
            difficulty,
            tags,
            examples,
            constraints,
            testCases,
            codeSnippets,
            referenceSolution,
            referenceSolutions
        } = body;

        const normalizedReferenceSolution = referenceSolution ?? referenceSolutions;

        if(!title || !description || !difficulty || !tags || !examples || !constraints || !testCases || !codeSnippets || !normalizedReferenceSolution){
            return NextResponse.json({error: "Missing required fields"}, {status: 404});
        }

        if(!Array.isArray(testCases) || testCases.length === 0){
            return NextResponse.json({error: "At least one testcase required"}, {status: 400});
        }

        if(typeof normalizedReferenceSolution !== 'object'){
            return NextResponse.json({error: "Reference solution must be provided for all supported languages"}, {status: 400});
        }

        const newProblem = await db.problem.create({
            data:{
                title,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                testCases,
                codeSnippets,
                referenceSolution: normalizedReferenceSolution,
                userId: user.id
            }
        })

        return NextResponse.json({
            success: true,
            message: "Problem created successfully",
            data: newProblem,
        }, {status: 201});



    } catch (error) {
        console.log("Database error: ", error);
        return NextResponse.json({error: "Internal Server Error. Failed to create problem"}, {status: 500});
    }
}