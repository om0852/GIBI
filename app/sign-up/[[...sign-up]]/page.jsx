import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              card: 
                "bg-white dark:bg-gray-800 shadow-md",
              headerTitle: 
                "text-gray-900 dark:text-white",
              headerSubtitle: 
                "text-gray-600 dark:text-gray-300",
              socialButtonsBlockButton: 
                "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600",
              dividerLine: 
                "bg-gray-200 dark:bg-gray-600",
              dividerText: 
                "text-gray-500 dark:text-gray-400",
              formFieldLabel: 
                "text-gray-700 dark:text-gray-200",
              formFieldInput: 
                "border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500",
              footerActionLink: 
                "text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
} 