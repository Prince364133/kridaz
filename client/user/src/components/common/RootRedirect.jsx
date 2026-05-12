import UserHome from "@user/pages/Home";

const RootRedirect = () => {
 // Users always land on the home page.
 // They can navigate to their dashboard via the profile dropdown.
 return <UserHome />;
};

export default RootRedirect;
