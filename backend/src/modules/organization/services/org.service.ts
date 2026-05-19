import { authClient } from "../../auth/auth.config"

const createOrganisation = async() => {
    const {data, error} = await authClient.organization.create({
        
    })

}