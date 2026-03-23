import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <Card className="w-full text-center">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">404 Error</p>
          <CardTitle className="text-3xl">Page not found</CardTitle>
          <CardDescription>
            The page you’re looking for does not exist or may have been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can go back to the room search page or return to login.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/rooms">Go to Rooms</Link>
            </Button>

            <Button asChild variant="outline">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotFoundPage;
