import { Component } from "react";

import { AlertTriangle } from "lucide-react";


/*
 * Without this, a render error anywhere in the tree unmounts the whole
 * app and leaves a blank white page with no way back.
 */
class ErrorBoundary extends Component {
    state = {
        hasError: false,
    };


    static getDerivedStateFromError() {
        return {
            hasError: true,
        };
    }


    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error("Unhandled render error:", error, info);
        }
    }


    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }


        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">

                <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">

                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertTriangle size={20} />
                    </div>


                    <h1 className="mt-4 text-base font-semibold text-neutral-900">
                        Something went wrong
                    </h1>


                    <p className="mt-1 text-sm text-neutral-500">
                        The page ran into an unexpected error. Reloading usually fixes it.
                    </p>


                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                        className="mt-5 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Reload page
                    </button>

                </div>

            </div>
        );
    }
}


export default ErrorBoundary;
