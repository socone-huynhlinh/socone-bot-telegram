import { Pool } from "pg";
import { IWorkShiftRepository } from "../i-work-shift.repository"
import dbConnection from "../../config/database";
import { queryData } from "../../utils/query";
import Shift from "../../models/shift";

export class WorkShiftRepository implements IWorkShiftRepository {
    private pg: Pool
    constructor() {
        this.pg = dbConnection.getPool()
    }
    getTypeWorkShifts(): Promise<string[] | null> {
        try{
            const query = `
               SELECT DISTINCT type
                FROM public.shifts;
            `
            const result = queryData<string>(this.pg, query, [])
            return result
        }catch(err){
            console.error("Error fetching work shifts:",err)
            throw err
        }
    }
    getWorkShiftsByType(typeWork: string): Promise<Shift[] | null> {
        try{
            const query = `
                SELECT * FROM shifts WHERE type=$1;
            `
            const result = queryData<Shift>(this.pg, query, [typeWork])
            return result
        }catch(err){
            console.error("Error fetching work shifts:",err)
            throw err
        }
    }
   
   
   
}