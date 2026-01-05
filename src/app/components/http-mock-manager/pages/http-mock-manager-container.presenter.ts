import { Injectable, OnDestroy } from "@angular/core";

@Injectable()
export class HttpMockManagerContainerPresenter implements OnDestroy {
    
    ngOnDestroy(): void {
        throw new Error("Method not implemented.");
    }
}