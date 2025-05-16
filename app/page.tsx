import ServiceAccountAuth from "./components/service-account-auth"
import GoogleAuth from "./components/google-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">Firebase Firestore Authentication</h1>
        <p className="text-center text-muted-foreground">
          Choose your preferred authentication method to access Firestore
        </p>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google">Google Sign-in</TabsTrigger>
            <TabsTrigger value="service-account">Service Account</TabsTrigger>
          </TabsList>
          <TabsContent value="google">
            <GoogleAuth />
          </TabsContent>
          <TabsContent value="service-account">
            <ServiceAccountAuth />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
