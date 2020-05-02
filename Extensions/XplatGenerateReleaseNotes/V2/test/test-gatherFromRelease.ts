import {IdentityRef} from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import {AddDataFromRelease, Convert} from "../ReleaseNotesFunctions";
import {Change as ChangeRelease, Release, ReleaseWorkItemRef} from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import {IReleaseApi} from "azure-devops-node-api/ReleaseApi";
import {instance, mock, when} from "ts-mockito";

const expect = require("chai").expect;

describe("Convert ReleaseChange to BuildChange object", function () {
    it("All fields have same value", function () {
        // Arrange
        const releaseChange = CreateReleaseChange();

        // Act
        const buildChange = Convert(releaseChange);

        // Assert
        expect(buildChange.id).eq(releaseChange.id);
        expect(buildChange.messageTruncated).eq(false);
        expect(buildChange.timestamp).eq(releaseChange.timestamp);
        expect(buildChange.pusher).eq(releaseChange.pusher);
        expect(buildChange.message).eq(releaseChange.message);
        expect(buildChange.location).eq(releaseChange.location);
        expect(buildChange.displayUri).eq(releaseChange.displayUri);
        expect(buildChange.author).eq(releaseChange.author);
        expect(buildChange.type).eq(releaseChange.changeType);

    });
} );

describe("GatherDataFromRelease", function () {
    it("should return corresponding wi/cs when release api finds some results", async function () {
        // Arrange
        const releaseId = 2;
        const lastSuccessfullRelease = {id: 1} as Release;
        const teamProject = "teamProject";

        const workItemInDiff = CreateWorkItem();
        const releaseChange = CreateReleaseChange();

        const mockedReleaseApi = mock<IReleaseApi>();
        when(mockedReleaseApi.getReleaseChanges(teamProject, releaseId, lastSuccessfullRelease.id)).thenReturn(Promise.resolve([releaseChange]));
        when(mockedReleaseApi.getReleaseWorkItemsRefs(teamProject, releaseId, lastSuccessfullRelease.id)).thenReturn(Promise.resolve([workItemInDiff]));

        const releaseApi = instance(mockedReleaseApi);

        // Act
        const result = await AddDataFromRelease(releaseId, lastSuccessfullRelease, releaseApi, teamProject);
        const buildChange = Convert(releaseChange);

        // Assert
        expect(result.workitems).to.have.lengthOf(1).and.contain(workItemInDiff);
        expect(result.commits).to.have.lengthOf(1).and.contain(buildChange);

    });

    it("should return empty arrays when api returns null", async function () {
        // Arrange
        const releaseId = 2;
        const lastSuccessfullRelease = {id: 1} as Release;
        const teamProject = "teamProject";

        const mockedReleaseApi = mock<IReleaseApi>();
        when(mockedReleaseApi.getReleaseChanges(teamProject, releaseId, lastSuccessfullRelease.id)).thenReturn(Promise.resolve([]));
        when(mockedReleaseApi.getReleaseWorkItemsRefs(teamProject, releaseId, lastSuccessfullRelease.id)).thenReturn(Promise.resolve([]));

        const releaseApi = instance(mockedReleaseApi);

        // Act
        const result = await AddDataFromRelease(releaseId, lastSuccessfullRelease, releaseApi, teamProject);

        // Assert
        expect(result.workitems).to.be.an("array").and.have.lengthOf(0);
        expect(result.commits).to.be.an("array").and.have.lengthOf(0);

    });

    it("should return empty arrays when release api fails", async function () {
        // Arrange
        const releaseId = 2;
        const lastSuccessfullRelease = {id: 1} as Release;
        const teamProject = "teamProject";

        const mockedReleaseApi = mock<IReleaseApi>();
        when(mockedReleaseApi.getReleaseChanges(teamProject, releaseId, lastSuccessfullRelease.id)).thenThrow(new Error("errorCs"));
        when(mockedReleaseApi.getReleaseWorkItemsRefs(teamProject, releaseId, lastSuccessfullRelease.id)).thenThrow(new Error("errorWi"));

        const releaseApi = instance(mockedReleaseApi);

        // Act
        const result = await AddDataFromRelease(releaseId, lastSuccessfullRelease, releaseApi, teamProject);

        // Assert
        expect(result.workitems).to.be.an("array").and.have.lengthOf(0);
        expect(result.commits).to.be.an("array").and.have.lengthOf(0);

    });
});

function CreateWorkItem() {
    return {
        id: "55",
        assignee: "assignee",
        state: "state",
        title: "title",
        type: "type",
        url: "url"
    } as ReleaseWorkItemRef;
}

function CreateReleaseChange() {
    return {
        id: "111",
        timestamp: new Date(),
        pusher: "pusher",
        message: "message",
        location: "location",
        displayUri: "http://displayUri",
        author: {id: "author"} as IdentityRef,
        changeType: "type"
    } as ChangeRelease;
}